import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  searchedUsers: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSearchLoading: false,
  typingUsers: {},

  // =========================
  // GET USERS
  // =========================
  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/users");

      const sortedUsers = res.data.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );

      set({ users: sortedUsers });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // =========================
  // SEARCH USERS
  // =========================
  searchUsers: async (query) => {
    const { users } = get();

    const filtered = users.filter((user) =>
      user.fullName?.toLowerCase().includes(query.toLowerCase())
    );

    set({ searchedUsers: filtered });
  },

  clearSearch: () => set({ searchedUsers: [] }),

  // =========================
  // GET MESSAGES
  // =========================
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      set({ messages: res.data });

      const socket = useAuthStore.getState().socket;
      socket?.emit("markAsRead", { senderId: userId });

      set((state) => ({
        users: state.users.map((u) =>
          u._id === userId ? { ...u, unreadCount: 0 } : u
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // =========================
  // SEND MESSAGE
  // =========================
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  // =========================
  // SOCKET LISTENERS
  // =========================
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("typing");
    socket.off("stopTyping");

    // =========================
    // NEW MESSAGE
    // =========================
    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();

      const isChatOpen =
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id);

      if (isChatOpen) {
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));

        socket.emit("markAsRead", {
          senderId: newMessage.senderId,
        });
      }

      set((state) => {
        const updatedUsers = state.users.map((u) => {
          if (
            u._id === newMessage.senderId ||
            u._id === newMessage.receiverId
          ) {
            return {
              ...u,
              lastMessage: newMessage.text || newMessage.message,
              updatedAt: newMessage.createdAt || new Date(),
              unreadCount: isChatOpen ? 0 : (u.unreadCount || 0) + 1,
            };
          }
          return u;
        });

        updatedUsers.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        return { users: updatedUsers };
      });
    });

    // =========================
    // READ RECEIPT
    // =========================
    socket.on("messagesRead", ({ senderId }) => {
      set((state) => ({
        users: state.users.map((u) =>
          u._id === senderId ? { ...u, unreadCount: 0 } : u
        ),
        messages: state.messages.map((m) =>
          m.senderId === senderId ? { ...m, isRead: true } : m
        ),
      }));
    });

    // =========================
    // TYPING
    // =========================
    socket.on("typing", ({ senderId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [senderId]: true,
        },
      }));
    });

    socket.on("stopTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [senderId]: false,
        },
      }));
    });
  },

  // =========================
  // UNSUBSCRIBE
  // =========================
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("messagesRead");
    socket?.off("typing");
    socket?.off("stopTyping");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));