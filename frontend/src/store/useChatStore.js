import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const toId = (value) => String(value);

const sortConversationsByRecent = (conversations) =>
  [...conversations].sort(
    (a, b) =>
      new Date(b?.lastMessage?.createdAt || b?.updatedAt || 0) -
      new Date(a?.lastMessage?.createdAt || a?.updatedAt || 0),
  );

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  conversations: [],
  selectedUser: null,
  isUsersLoading: false,
  isConversationsLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    console.log("[GETCONV] Fetching recent conversations...");
    try {
      const res = await axiosInstance.get("/messages/conversations/recent");
      console.log(
        "[GETCONV] Received",
        res.data?.length || 0,
        "conversations:",
        res.data?.map((c) => c.otherUser?.fullName),
      );
      set({ conversations: sortConversationsByRecent(res.data) });
    } catch (error) {
      console.error(
        "[GETCONV] Error:",
        error?.response?.status,
        error?.message,
      );
      toast.error(
        error.response?.data?.message || "Failed to fetch conversations",
      );
      set({ conversations: [] });
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  upsertConversationFromMessage: (message, otherUser) => {
    if (!message) return;

    const { authUser } = useAuthStore.getState();
    if (!authUser?._id) {
      console.warn("[UPSERT] No authUser, skipping");
      return;
    }
    console.log("[UPSERT] Called with message:", message);

    const myId = toId(authUser._id);
    const senderId = toId(message.senderId);
    const receiverId = toId(message.receiverId);

    const otherUserId = senderId === myId ? receiverId : senderId;
    console.log(
      "[UPSERT] otherUserId:",
      otherUserId,
      "myId:",
      myId,
      "senderId:",
      senderId,
    );

    set((state) => {
      const existingIndex = state.conversations.findIndex(
        (conversation) => toId(conversation?.otherUser?._id) === otherUserId,
      );
      console.log(
        "[UPSERT] existingIndex:",
        existingIndex,
        "current convos count:",
        state.conversations.length,
      );

      const fallbackUser = state.users.find(
        (user) => toId(user._id) === otherUserId,
      );

      const resolvedOtherUser =
        otherUser ||
        (toId(state.selectedUser?._id) === otherUserId
          ? state.selectedUser
          : fallbackUser);

      const baseConversation =
        existingIndex >= 0
          ? state.conversations[existingIndex]
          : {
              otherUser: {
                _id: otherUserId,
                fullName: resolvedOtherUser?.fullName || "Unknown User",
                profilePic: resolvedOtherUser?.profilePic || "",
                email: resolvedOtherUser?.email || "",
              },
            };

      const updatedConversation = {
        ...baseConversation,
        otherUser: {
          ...baseConversation.otherUser,
          ...resolvedOtherUser,
          _id: otherUserId,
        },
        lastMessage: {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          image: message.image,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        },
        updatedAt:
          message.createdAt || message.updatedAt || new Date().toISOString(),
      };

      const conversationsWithoutCurrent =
        existingIndex >= 0
          ? state.conversations.filter((_, idx) => idx !== existingIndex)
          : state.conversations;

      const newConvos = [updatedConversation, ...conversationsWithoutCurrent];
      console.log(
        "[UPSERT] New convos order (first 2):",
        newConvos.slice(0, 2).map((c) => c.otherUser?.fullName),
      );
      return {
        conversations: newConvos,
      };
    });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      console.error("Error fetching messages:", error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, upsertConversationFromMessage } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser || selectedUser._id === authUser?._id) {
      toast.error("You cannot send a message to yourself");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      set((state) => ({ messages: [...state.messages, res.data] }));
      upsertConversationFromMessage(res.data, selectedUser);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      console.error("Error sending message:", error);
    }
  },

  subscribeToMessages: () => {
    const { upsertConversationFromMessage } = get();

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      console.log("[SOCKET] newMessage received from:", newMessage.senderId);
      const { selectedUser, conversations } = get();
      console.log("[SOCKET] Current convos count:", conversations.length);
      upsertConversationFromMessage(newMessage);

      if (!selectedUser?._id) return;

      const isMessageSentFromSelectedUser =
        toId(newMessage.senderId) === toId(selectedUser._id);
      if (!isMessageSentFromSelectedUser) return;

      set((state) => {
        const messageExists = state.messages.some(
          (message) => toId(message._id) === toId(newMessage._id),
        );
        if (messageExists) return state;

        return {
          messages: [...state.messages, newMessage],
        };
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
