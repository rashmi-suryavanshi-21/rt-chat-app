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
  // HELPERS
  // =========================
  moveUserToTop: (users, userId, msg) => {
    const index = users.findIndex(
      (u) => u._id?.toString() === userId?.toString()
    );

    if (index === -1) return users;

    const user = users[index];

    const updatedUser = {
      ...user,
      lastMessage: msg?.text || msg?.message || "",
      lastMessageId: msg?._id || null,
      updatedAt: msg?.createdAt || new Date().toISOString(),
    };

    const newUsers = [...users];
    newUsers.splice(index, 1);
    newUsers.unshift(updatedUser);

    return newUsers;
  },

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
    const { selectedUser } = get();

    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set((state) => {
        const exists = state.messages.some(
          (m) => m._id === res.data._id
        );

        if (exists) return state;

        return {
          messages: [...state.messages, res.data],
          users: get().moveUserToTop(state.users, selectedUser._id, res.data),
        };
      });

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  // =========================
  // DELETE MESSAGE (FIXED)
  // =========================
 deleteMessage: async (id) => {
  try {
    await axiosInstance.delete(`/messages/delete/${id}`);

    set((state) => {
      const updatedMessages = state.messages.map((m) =>
        m._id === id
          ? { ...m, isDeleted: true, text: "This message was deleted" }
          : m
      );

      return {
        messages: updatedMessages,

        users: state.users.map((u) =>
          u.lastMessageId === id
            ? {
                ...u,
                lastMessage: "This message was deleted",
              }
            : u
        ),
      };
    });

  } catch (error) {
    toast.error("Delete failed");
  }
},
  // =========================
  // UPDATE MESSAGE
  // =========================
  updateMessage: async (id, text) => {
    try {
      await axiosInstance.put(`/messages/update/${id}`, { text });

      set({
        messages: get().messages.map((m) =>
          m._id === id ? { ...m, text } : m
        ),
      });

    } catch {
      toast.error("Update failed");
    }
  },

  // =========================
  // SOCKET (FIXED DUPLICATES)
  // =========================
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const myId = useAuthStore.getState().authUser?._id?.toString();

      const isChatOpen =
        selectedUser &&
        (newMessage.senderId?.toString() === selectedUser._id?.toString() ||
          newMessage.receiverId?.toString() === selectedUser._id?.toString());

      // CHAT OPEN → add message once only
      if (isChatOpen) {
        set((state) => {
          const exists = state.messages.some(
            (m) => m._id === newMessage._id
          );

          if (exists) return state;

          return {
            messages: [...state.messages, newMessage],
          };
        });

        socket.emit("markAsRead", {
          senderId: newMessage.senderId,
        });
      }

      // SIDEBAR UPDATE
      set((state) => {
        const users = [...state.users];

        const otherUserId =
          newMessage.senderId?.toString() === myId
            ? newMessage.receiverId?.toString()
            : newMessage.senderId?.toString();

        const index = users.findIndex(
          (u) => u._id?.toString() === otherUserId
        );

        if (index === -1) return state;

        const user = users[index];

        const updatedUser = {
          ...user,
          lastMessage: newMessage.text || "",
          lastMessageId: newMessage._id,
          updatedAt: newMessage.createdAt || new Date().toISOString(),
          unreadCount: isChatOpen
            ? 0
            : (user.unreadCount || 0) + 1,
        };

        users.splice(index, 1);
        users.unshift(updatedUser);

        return { users };
      });
    });

    socket.off("messagesRead");
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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));