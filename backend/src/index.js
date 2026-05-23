import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const server = http.createServer(app);

// ========================
// ENV CONFIG (PRODUCTION SAFE)
// ========================
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// IMPORTANT: allow multiple origins in production if needed
const ALLOWED_ORIGINS = [FRONTEND_URL, "http://localhost:5173"];

// ========================
// SECURITY HEADERS
// ========================
app.use(helmet());

// IMPORTANT for AWS / reverse proxy (EC2)
app.set("trust proxy", 1);

// ========================
// RATE LIMITING
// ========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests, try again later",
});
app.use("/api", limiter);

// ========================
// CORS (PRODUCTION SAFE)
// ========================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile apps / postman
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ========================
// BODY PARSING
// ========================
app.use(express.json());
app.use(cookieParser());

// ========================
// ROUTES
// ========================
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);

// ========================
// SOCKET.IO (PRODUCTION SAFE)
// ========================
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

global.io = io;

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.join(userId);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

// ========================
// START SERVER
// ========================
server.listen(PORT, "0.0.0.0", async () => {
  try {
    await connectDB();
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.error("DB Connection failed:", err);
  }
});
