import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "Hey there 👋 I’m using Chat Mania to connect, chat, and make new friends.",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      default: null,
    },
    verificationOTPExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
