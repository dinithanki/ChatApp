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
  blockedUsers: [],
  isLoading: false,

  loadFriendData: async () => {
    set({ isLoading: true });
    console.log("[DEBUG] loadFriendData called");
    try {
      const [pendingRes, sentRes, contactsRes, blockedRes] = await Promise.all([
        axiosInstance.get("/friends/pending"),
        axiosInstance.get("/friends/sent"),
        axiosInstance.get("/friends/contacts"),
        axiosInstance.get("/friends/blocked"),
      ]);

      console.log("[DEBUG] API Responses:", {
        pending: pendingRes.data?.length || 0,
        sent: sentRes.data?.length || 0,
        contacts: contactsRes.data?.length || 0,
      });
      console.log("[DEBUG] Contacts data:", contactsRes.data);

      set({
        pendingRequests: pendingRes.data || [],
        sentRequests: sentRes.data || [],
        contacts: contactsRes.data || [],
        blockedUsers: blockedRes.data || [],
      });

      console.log("[DEBUG] Friends store updated", {
        contacts: (contactsRes.data || []).length,
        blocked: (blockedRes.data || []).length,
      });
    } catch (error) {
      console.error("[DEBUG] Error loading friend data:", error.message);
      console.error(
        "[DEBUG] Error response:",
        error.response?.status,
        error.response?.data,
      );
      console.error("[DEBUG] Error details:", error);
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
      await get().loadFriendData();
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

  deleteContact: async (contactId) => {
    try {
      await axiosInstance.delete(`/friends/delete/${contactId}`);
      set((state) => ({
        contacts: state.contacts.filter((c) => toId(c._id) !== toId(contactId)),
        pendingRequests: state.pendingRequests.filter(
          (request) =>
            toId(request.senderId?._id || request.senderId) !==
              toId(contactId) &&
            toId(request.receiverId?._id || request.receiverId) !==
              toId(contactId),
        ),
        sentRequests: state.sentRequests.filter(
          (request) =>
            toId(request.senderId?._id || request.senderId) !==
              toId(contactId) &&
            toId(request.receiverId?._id || request.receiverId) !==
              toId(contactId),
        ),
      }));
      await get().loadFriendData();
      toast.success("Contact deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete contact");
      throw error;
    }
  },

  blockContact: async (contactId) => {
    try {
      await axiosInstance.post(`/friends/block/${contactId}`);
      set((state) => ({
        contacts: state.contacts.filter((c) => toId(c._id) !== toId(contactId)),
        pendingRequests: state.pendingRequests.filter(
          (request) =>
            toId(request.senderId?._id || request.senderId) !==
              toId(contactId) &&
            toId(request.receiverId?._id || request.receiverId) !==
              toId(contactId),
        ),
        sentRequests: state.sentRequests.filter(
          (request) =>
            toId(request.senderId?._id || request.senderId) !==
              toId(contactId) &&
            toId(request.receiverId?._id || request.receiverId) !==
              toId(contactId),
        ),
      }));
      await get().loadFriendData();
      toast.success("Contact blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block contact");
      throw error;
    }
  },

  unblockContact: async (contactId) => {
    try {
      await axiosInstance.post(`/friends/unblock/${contactId}`);
      // Refresh friend data so unblocked user appears in contacts
      await get().loadFriendData();
      toast.success("Contact unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock contact");
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
