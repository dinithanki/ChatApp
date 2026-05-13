import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    //hash the password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      // Generate 6-digit OTP and save hash + expiry
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      newUser.verificationOTP = otpHash;
      newUser.verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      await newUser.save();

      // Send OTP email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newUser.email,
        subject: "Verify your email - ChatApp",
        html: `
                <h2>Verify Your Email</h2>
                <p>Your verification code is:</p>
                <h3 style="letter-spacing:6px">${otp}</h3>
                <p>This code will expire in 10 minutes.</p>
            `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error("Error sending verification email:", emailErr);
      }

      res.status(201).json({
        message:
          "Account created. OTP sent to email. Please verify to activate account",
        email: newUser.email,
        userId: newUser._id,
      });
    } else {
      res.status(400).json({ message: "Error creating user" });
    }
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ message: "Error in signup controller" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    //generate JWT token here
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Error in login controller" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    res.status(500).json({ message: "Error in logout controller" });
  }
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res
        .status(200)
        .json({ message: "If email exists, reset link will be sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiry (10 minutes)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request - ChatApp",
      html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Please provide password and confirm password" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the token to find user
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid request" });

    if (user.isVerified)
      return res.status(200).json({ message: "Email already verified" });

    if (
      !user.verificationOTP ||
      !user.verificationOTPExpires ||
      user.verificationOTPExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "OTP expired or not found. Please resend OTP." });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== user.verificationOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationOTPExpires = null;
    await user.save();

    // generate token on successful verification
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    res.status(500).json({ message: "Error verifying email" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(200).json({ message: "Email already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.verificationOTP = otpHash;
    user.verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your verification code - ChatApp",
      html: `
                <h2>Verify Your Email</h2>
                <p>Your verification code is:</p>
                <h3 style="letter-spacing:6px">${otp}</h3>
                <p>This code will expire in 10 minutes.</p>
            `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Error sending verification email:", emailErr);
    }

    res.status(200).json({ message: "OTP resent to your email" });
  } catch (error) {
    console.error("Error in resendOTP controller:", error);
    res.status(500).json({ message: "Error resending OTP" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true },
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error);
    res.status(500).json({ message: "Error in updateProfile controller" });
  }
};
export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error);
    res.status(500).json({ message: "Error in checkAuth controller" });
  }
};
