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

function normalizeOrigin(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

// ========================
// ENV CONFIG (PRODUCTION SAFE)
// ========================
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = normalizeOrigin(
  process.env.FRONTEND_URL || "http://localhost:5173",
);
const EXTRA_CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

// IMPORTANT: allow localhost, configured origins, and Vercel preview deployments.
const ALLOWED_ORIGINS = new Set([
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...EXTRA_CORS_ORIGINS,
]);

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  return (
    typeof origin === "string" && /(^https:\/\/.+\.vercel\.app$)/.test(origin)
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / postman
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

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
app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

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
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
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
