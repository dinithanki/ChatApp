import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";

const areFriends = (user, otherUserId) => {
  if (!user?.friends) return false;

  return user.friends.some(
    (friendId) => friendId.toString() === otherUserId.toString(),
  );
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all users who have blocked the current user
    const blockedByOthers = await User.find({
      blockedUsers: loggedInUserId,
    }).select("_id");
    const blockedByOthersIds = blockedByOthers.map((u) => u._id);

    // Combine all IDs to exclude (self + users who blocked current user)
    const excludeIds = [loggedInUserId, ...blockedByOthersIds];

    // Note: Users blocked BY the current user will still appear in results
    // so they can view the Unblock button in All Users page
    const users = await User.find({ _id: { $nin: excludeIds } }).select(
      "-password",
    );
    res.status(200).json(users);
  } catch (err) {
    console.error("Error in getUsersForSidebar:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const myId = req.user._id;
    const user = await User.findById(myId).select("friends");

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      {
        $addFields: {
          otherUserId: {
            $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$otherUserId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      { $unwind: "$otherUser" },
      {
        $project: {
          _id: 0,
          otherUser: {
            _id: "$otherUser._id",
            fullName: "$otherUser.fullName",
            profilePic: "$otherUser.profilePic",
            email: "$otherUser.email",
          },
          lastMessage: {
            _id: "$lastMessage._id",
            senderId: "$lastMessage.senderId",
            receiverId: "$lastMessage.receiverId",
            text: "$lastMessage.text",
            image: "$lastMessage.image",
            createdAt: "$lastMessage.createdAt",
            updatedAt: "$lastMessage.updatedAt",
          },
          updatedAt: "$lastMessage.updatedAt",
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    const filteredConversations = conversations.filter((conversation) =>
      areFriends(user, conversation.otherUser._id),
    );

    // Decrypt the last message preview for the sidebar
    const decryptedConversations = filteredConversations.map((conv) => {
      if (conv.lastMessage && conv.lastMessage.text) {
        conv.lastMessage.text = decryptMessage(conv.lastMessage.text);
      }
      return conv;
    });

    res.status(200).json(decryptedConversations);
  } catch (err) {
    console.error("Error in getConversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const currentUser = await User.findById(myId).select("friends");
    if (!areFriends(currentUser, userToChatId)) {
      return res
        .status(403)
        .json({ message: "You can only chat with contacts" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Decrypt messages before sending to client
    const decryptedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
      if (msgObj.text) {
        msgObj.text = decryptMessage(msgObj.text);
      }
      return msgObj;
    });

    res.status(200).json(decryptedMessages);
  } catch (err) {
    console.error("Error in getMessages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const sender = await User.findById(senderId).select("friends");

    if (receiverId === senderId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot send a message to yourself" });
    }

    if (!areFriends(sender, receiverId)) {
      return res.status(403).json({ message: "You can only message contacts" });
    }

    let imageUrl;
    if (image) {
      //upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptMessage(text),
      image: imageUrl,
    });
    await newMessage.save();

    // Create an unencrypted version of the message for realtime socket emission
    // We do NOT want to send the encrypted hash to the frontend!
    const unencryptedMessage = {
      ...newMessage.toObject(),
      text: text, // The original unencrypted text
    };

    // Real-time functionality with socket.io
    const io = global.io;
    if (io) {
      io.to(receiverId.toString()).emit("newMessage", unencryptedMessage);
      io.to(senderId.toString()).emit("newMessage", unencryptedMessage);
    }

    res.status(201).json(unencryptedMessage);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
