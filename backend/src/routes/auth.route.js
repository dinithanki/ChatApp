import express from "express";
import {
  checkAuth,
  signup,
  login,
  logout,
  updateProfile,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const route = express.Router();

route.post("/signup", signup);
route.post("/login", login);
route.post("/verify-email", verifyEmail);
route.post("/resend-otp", resendOTP);
route.post("/logout", logout);
route.put("/update-profile", protectRoute, updateProfile);
route.get("/check", protectRoute, checkAuth);
route.post("/forgot-password", forgotPassword);
route.post("/reset-password/:token", resetPassword);

export default route;
