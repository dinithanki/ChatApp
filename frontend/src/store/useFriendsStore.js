import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

const toId = (value) => String(value);

const getOtherUser = (request) => {
  const { authUser } = useAuthStore.getState();
  const senderId = request?.senderId?._id || request?.senderId;
  const receiverId = request?.receiverId?._id || request?.receiverId;

  if (authUser?._id && toId(senderId) === toId(authUser._id)) {
    return request.receiverId;
  }

  return request.senderId;
};

const addUniqueById = (items, item) => {
  if (!item?._id) return items;
  if (items.some((existing) => toId(existing._id) === toId(item._id))) {
    return items;
  }
  return [item, ...items];
};

export const useFriendsStore = create((set, get) => ({
  pendingRequests: [],
  sentRequests: [],
  contacts: [],
  isLoading: false,

  loadFriendData: async () => {
    set({ isLoading: true });
    try {
      const [pendingRes, sentRes, contactsRes] = await Promise.all([
        axiosInstance.get("/friends/pending"),
        axiosInstance.get("/friends/sent"),
        axiosInstance.get("/friends/contacts"),
      ]);

      set({
        pendingRequests: pendingRes.data || [],
        sentRequests: sentRes.data || [],
        contacts: contactsRes.data || [],
      });
    } catch (error) {
      console.error("Error loading friend data:", error);
      toast.error(error.response?.data?.message || "Failed to load friends");
    } finally {
      set({ isLoading: false });
    }
  },

  sendFriendRequest: async (receiverId) => {
    try {
      const res = await axiosInstance.post(`/friends/send/${receiverId}`);
      set((state) => ({
        sentRequests: addUniqueById(
          [res.data, ...state.sentRequests],
          res.data,
        ),
      }));
      toast.success("Friend request sent");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
      throw error;
    }
  },

  acceptFriendRequest: async (requestId) => {
    try {
      const res = await axiosInstance.post(`/friends/accept/${requestId}`);
      const request = res.data;
      const friendUser = getOtherUser(request);

      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (item) => item._id !== requestId,
        ),
        sentRequests: state.sentRequests.filter(
          (item) => item._id !== requestId,
        ),
        contacts: friendUser
          ? addUniqueById(state.contacts, friendUser)
          : state.contacts,
      }));

      toast.success("Friend request accepted");
      return request;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
      throw error;
    }
  },

  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/reject/${requestId}`);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter(
          (item) => item._id !== requestId,
        ),
        sentRequests: state.sentRequests.filter(
          (item) => item._id !== requestId,
        ),
      }));
      toast.success("Friend request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
      throw error;
    }
  },

  handleFriendRequestReceived: (request) => {
    set((state) => ({
      pendingRequests: addUniqueById(
        [request, ...state.pendingRequests],
        request,
      ),
    }));
  },

  handleFriendRequestSent: (request) => {
    set((state) => ({
      sentRequests: addUniqueById([request, ...state.sentRequests], request),
    }));
  },

  handleFriendRequestAccepted: (request) => {
    const friendUser = getOtherUser(request);
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (item) => item._id !== request._id,
      ),
      sentRequests: state.sentRequests.filter(
        (item) => item._id !== request._id,
      ),
      contacts: friendUser
        ? addUniqueById(state.contacts, friendUser)
        : state.contacts,
    }));
  },

  handleFriendRequestRejected: (payload) => {
    const requestId = payload?.requestId;
    if (!requestId) return;

    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (item) => item._id !== requestId,
      ),
      sentRequests: state.sentRequests.filter((item) => item._id !== requestId),
    }));
  },
}));
