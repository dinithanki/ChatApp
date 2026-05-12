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
      User.findById(senderId).select("friends blockedUsers"),
      User.findById(receiverId).select("friends blockedUsers"),
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

    // Check if the receiver has blocked the sender
    const isBlockedByReceiver = receiver.blockedUsers?.some(
      (blockedId) => blockedId.toString() === senderId.toString(),
    );
    if (isBlockedByReceiver) {
      return res.status(403).json({ message: "You are blocked by this user" });
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

    console.log("[DEBUG] acceptFriendRequest - requestId:", requestId);
    console.log("[DEBUG] acceptFriendRequest - userId:", userId);

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const senderId = request.senderId?._id || request.senderId;
    const receiverId = request.receiverId?._id || request.receiverId;

    if (!senderId || !receiverId) {
      await FriendRequest.findByIdAndDelete(requestId);
      return res.status(404).json({
        message: "Request is no longer valid. Request removed.",
      });
    }

    if (receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [senderUser, receiverUser] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!senderUser || !receiverUser) {
      await FriendRequest.findByIdAndDelete(requestId);
      return res.status(404).json({
        message: "One of the users no longer exists. Request removed.",
      });
    }

    request.status = "accepted";

    // Delete any other requests between these users to avoid unique constraint issues
    await FriendRequest.deleteMany({
      $or: [
        { senderId: senderUser._id, receiverId: receiverUser._id },
        { senderId: receiverUser._id, receiverId: senderUser._id },
      ],
      _id: { $ne: request._id },
    });

    await request.save();

    const result = await Promise.all([
      User.findByIdAndUpdate(senderUser._id, {
        $addToSet: { friends: receiverUser._id },
      }),
      User.findByIdAndUpdate(receiverUser._id, {
        $addToSet: { friends: senderUser._id },
      }),
    ]);

    console.log(
      "[DEBUG] Friends added to users - sender result:",
      result[0]?.friends?.length || 0,
    );
    console.log(
      "[DEBUG] Friends added to users - receiver result:",
      result[1]?.friends?.length || 0,
    );

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("senderId", populateUserFields)
      .populate("receiverId", populateUserFields);

    const io = global.io;
    if (io) {
      const senderIdStr = senderUser._id.toString();
      const receiverIdStr = receiverUser._id.toString();
      io.to(senderIdStr).emit("friendRequestAccepted", populatedRequest);
      io.to(receiverIdStr).emit("friendRequestAccepted", populatedRequest);
    }

    console.log("[DEBUG] acceptFriendRequest success - friendship created");
    res.status(200).json(populatedRequest);
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
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

    console.log("[DEBUG] getContacts - userId:", userId);
    console.log(
      "[DEBUG] getContacts - friends count:",
      user?.friends?.length || 0,
    );
    console.log("[DEBUG] getContacts - friends data:", user?.friends || []);

    res.status(200).json(user?.friends || []);
  } catch (error) {
    console.error("Error in getContacts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlocked = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      "blockedUsers",
      populateUserFields,
    );

    console.log("[DEBUG] getBlocked - userId:", userId);
    console.log(
      "[DEBUG] getBlocked - blocked count:",
      user?.blockedUsers?.length || 0,
    );
    console.log("[DEBUG] getBlocked - blocked data:", user?.blockedUsers || []);

    res.status(200).json(user?.blockedUsers || []);
  } catch (error) {
    console.error("Error in getBlocked:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    console.log(
      "[DEBUG] deleteContact - userId:",
      userId,
      "contactId:",
      contactId,
    );

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: contactId } }),
      User.findByIdAndUpdate(contactId, { $pull: { friends: userId } }),
      FriendRequest.deleteMany({
        $or: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId },
        ],
      }),
    ]);

    res.status(200).json({ message: "Contact deleted" });
  } catch (error) {
    console.error("Error in deleteContact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const blockContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    console.log(
      "[DEBUG] blockContact - userId:",
      userId,
      "contactId:",
      contactId,
    );

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { blockedUsers: contactId },
        $pull: { friends: contactId },
      }),
      User.findByIdAndUpdate(contactId, { $pull: { friends: userId } }),
      FriendRequest.deleteMany({
        $or: [
          { senderId: userId, receiverId: contactId },
          { senderId: contactId, receiverId: userId },
        ],
      }),
    ]);

    res.status(200).json({ message: "Contact blocked" });
  } catch (error) {
    console.error("Error in blockContact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    console.log(
      "[DEBUG] unblockContact - userId:",
      userId,
      "contactId:",
      contactId,
    );

    // Remove from blockedUsers and restore friendship
    const result = await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { blockedUsers: contactId },
        $addToSet: { friends: contactId },
      }),
      User.findByIdAndUpdate(contactId, {
        $addToSet: { friends: userId },
      }),
    ]);

    console.log(
      "[DEBUG] unblockContact - updated results:",
      result.map((r) => (r ? r._id : null)),
    );

    const io = global.io;
    if (io) {
      io.to(contactId.toString()).emit("unblocked", { by: userId });
      io.to(userId.toString()).emit("unblocked", { of: contactId });
    }

    res
      .status(200)
      .json({ message: "Contact unblocked and friendship restored" });
  } catch (error) {
    console.error("Error in unblockContact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
