import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getFriendsStatus,
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getContacts,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/status/:userId", protectRoute, getFriendsStatus);
router.post("/send/:receiverId", protectRoute, sendFriendRequest);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/sent", protectRoute, getSentRequests);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.delete("/reject/:requestId", protectRoute, rejectFriendRequest);
router.get("/contacts", protectRoute, getContacts);

export default router;
