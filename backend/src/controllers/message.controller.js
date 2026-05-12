import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

const areFriends = (user, otherUserId) => {
  if (!user?.friends) return false;

  return user.friends.some(
    (friendId) => friendId.toString() === otherUserId.toString(),
  );
};

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
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

    res.status(200).json(filteredConversations);
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

    res.status(200).json(messages);
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
      text,
      image: imageUrl,
    });
    await newMessage.save();

    // Real-time functionality with socket.io
    const io = global.io;
    if (io) {
      io.to(receiverId.toString()).emit("newMessage", newMessage);
      io.to(senderId.toString()).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
