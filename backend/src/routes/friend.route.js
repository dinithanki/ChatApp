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
  getBlocked,
  deleteContact,
  blockContact,
  unblockContact,
} from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/status/:userId", protectRoute, getFriendsStatus);
router.post("/send/:receiverId", protectRoute, sendFriendRequest);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/sent", protectRoute, getSentRequests);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.delete("/reject/:requestId", protectRoute, rejectFriendRequest);
router.get("/contacts", protectRoute, getContacts);
router.get("/blocked", protectRoute, getBlocked);
router.delete("/delete/:contactId", protectRoute, deleteContact);
router.post("/block/:contactId", protectRoute, blockContact);
router.post("/unblock/:contactId", protectRoute, unblockContact);

export default router;
