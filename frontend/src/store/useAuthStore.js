import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Socket.io base URL - use "/" in development to leverage Vite's proxy
const BASE_URL = import.meta.env.MODE === "development" ? "/" : import.meta.env.VITE_API_URL;

// Socket.io configuration from environment variables
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionDelay: parseInt(
    import.meta.env.VITE_SOCKET_RECONNECT_DELAY || "1000",
  ),
  reconnectionDelayMax: parseInt(
    import.meta.env.VITE_SOCKET_RECONNECT_DELAY_MAX || "5000",
  ),
  reconnectionAttempts: parseInt(
    import.meta.env.VITE_SOCKET_RECONNECT_ATTEMPTS || "5",
  ),
  transports: ["websocket", "polling"],
};

const TOAST_DURATION = parseInt(import.meta.env.VITE_TOAST_DURATION || "3000");
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === "true";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      // Return response to caller so UI can navigate to OTP page
      toast.success(res.data?.message || "Account created. Verify your email.");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign up failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyEmail: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/verify-email", data);
      set({ authUser: res.data });
      toast.success("Email verified, logged in");
      get().connectSocket();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
      throw error;
    }
  },

  resendOTP: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/resend-otp", data);
      toast.success(res.data?.message || "OTP resent");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Resend OTP failed");
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    if (DEBUG_MODE) {
      console.log("[Socket.io] Connecting with config:", SOCKET_CONFIG);
    }

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      ...SOCKET_CONFIG,
    });

    set({ socket: socket });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
  },
}));
