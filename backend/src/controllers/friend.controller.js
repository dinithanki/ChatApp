import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";

const populateUserFields = "fullName profilePic email";

export const getFriendsStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;

    if (userId.toString() === otherUserId) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const currentUser = await User.findById(userId).select("friends");
    const isFriend = currentUser.friends.some(
      (friendId) => friendId.toString() === otherUserId,
    );

    const sentRequest = await FriendRequest.findOne({
      senderId: userId,
      receiverId: otherUserId,
      status: "pending",
    });

    const receivedRequest = await FriendRequest.findOne({
      senderId: otherUserId,
      receiverId: userId,
      status: "pending",
    });

    res.status(200).json({
      isFriend,
      sentRequest: !!sentRequest,
      receivedRequest: !!receivedRequest,
    });
  } catch (error) {
    console.error("Error in getFriendsStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select("friends"),
      User.findById(receiverId).select("friends"),
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFriends = sender.friends.some(
      (friendId) => friendId.toString() === receiverId,
    );
    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId, status: "pending" },
        { senderId: receiverId, receiverId: senderId, status: "pending" },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already exists" });
    }

    const request = await FriendRequest.create({
      senderId,
      receiverId,
      status: "pending",
    });

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("senderId", populateUserFields)
      .populate("receiverId", populateUserFields);

    const io = global.io;
    if (io) {
      io.to(receiverId.toString()).emit(
        "friendRequestReceived",
        populatedRequest,
      );
      io.to(senderId.toString()).emit("friendRequestSent", populatedRequest);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Request already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const receiverId = req.user._id;

    const requests = await FriendRequest.find({
      receiverId,
      status: "pending",
    })
      .populate("senderId", populateUserFields)
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const senderId = req.user._id;

    const requests = await FriendRequest.find({
      senderId,
      status: "pending",
    })
      .populate("receiverId", populateUserFields)
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getSentRequests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = "accepted";
    await request.save();

    await Promise.all([
      User.findByIdAndUpdate(request.senderId, {
        $addToSet: { friends: request.receiverId },
      }),
      User.findByIdAndUpdate(request.receiverId, {
        $addToSet: { friends: request.senderId },
      }),
    ]);

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("senderId", populateUserFields)
      .populate("receiverId", populateUserFields);

    const io = global.io;
    if (io) {
      io.to(request.senderId.toString()).emit(
        "friendRequestAccepted",
        populatedRequest,
      );
      io.to(request.receiverId.toString()).emit(
        "friendRequestAccepted",
        populatedRequest,
      );
    }

    res.status(200).json(populatedRequest);
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    const io = global.io;
    if (io) {
      io.to(request.senderId.toString()).emit("friendRequestRejected", {
        requestId,
        senderId: request.senderId,
        receiverId: request.receiverId,
      });
      io.to(request.receiverId.toString()).emit("friendRequestRejected", {
        requestId,
        senderId: request.senderId,
        receiverId: request.receiverId,
      });
    }

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "friends",
      populateUserFields,
    );

    res.status(200).json(user?.friends || []);
  } catch (error) {
    console.error("Error in getContacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
