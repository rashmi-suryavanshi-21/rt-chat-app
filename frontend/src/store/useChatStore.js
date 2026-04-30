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
  notifications: [],

  // =========================
  // HELPERS
  // =========================
  moveUserToTop: (users, userId, msg) => {
    const index = users.findIndex(
      (u) => u._id?.toString() === userId?.toString(),
    );

    if (index === -1) return users;

    const user = users[index];

    const updatedUser = {
      ...user,
      lastMessage: msg?.text || "",
      lastMessageId: msg?._id || null,
      updatedAt: msg?.createdAt || new Date().toISOString(),
    };

    const newUsers = [...users];
    newUsers.splice(index, 1);
    newUsers.unshift(updatedUser);

    return newUsers;
  },

  // =========================
  //NOTIFICATIONs
  // =========================
  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications],
    })),

  clearNotifications: () => set({ notifications: [] }),

  // =========================
  // GET USERS
  // =========================
  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/users");

      const sortedUsers = res.data.sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
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
      user.fullName?.toLowerCase().includes(query.toLowerCase()),
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
          u._id === userId ? { ...u, unreadCount: 0 } : u,
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
        messageData,
      );

      set((state) => {
        const exists = state.messages.some((m) => m._id === res.data._id);
        if (exists) return state;

        return {
          messages: [...state.messages, res.data],
          users: get().moveUserToTop(state.users, selectedUser._id, res.data),
        };
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
    }
  },

  // =========================
  // DELETE MESSAGE
  // =========================
  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/delete/${id}`);

      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === id ? { ...m, isDeleted: true, text: "" } : m,
        ),

        users: state.users.map((u) =>
          u.lastMessageId === id
            ? { ...u, lastMessage: "This message was deleted" }
            : u,
        ),
      }));
    } catch (error) {
      toast.error("Delete failed");
    }
  },

  // =========================
  // UPDATE MESSAGE (FIXED)
  // =========================
  updateMessage: async (id, text) => {
    try {
      const res = await axiosInstance.put(`/messages/update/${id}`, { text });

      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === id ? { ...m, ...res.data, isEdited: true } : m,
        ),
      }));
    } catch {
      toast.error("Update failed");
    }
  },

  // =========================
  // SOCKET
  // =========================
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    // =========================
    // ✨ TYPING EVENTS (ADD THIS)
    // =========================
    socket.off("typing");
    socket.on("typing", ({ senderId }) => {
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [senderId]: true,
        },
      }));
    });

    socket.off("stopTyping");
    socket.on("stopTyping", ({ senderId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[senderId]; // cleaner than false

        return { typingUsers: updated };
      });
    });

    // =========================
    // 🔔 MESSAGE NOTIFICATION
    // =========================
    socket.off("newMessageNotification");

    socket.on("newMessageNotification", (data) => {
      const { addNotification ,selectedUser} = get();
      const myId = useAuthStore.getState().authUser?._id?.toString();

       if (
         data.senderId?.toString() !== myId &&
         data.receiverId?.toString() !== myId
       ) {
         return; // ignore чужe messages
       }

      console.log("🔥 NOTIFICATION RECEIVED:", data);

      // 🔥 check if chat is open
  const isChatOpen =
    selectedUser &&
    (selectedUser._id?.toString() === data.senderId?.toString() ||
      selectedUser._id?.toString() === data.receiverId?.toString());

      // 🔔 UI notification (ALWAYS WORKS)
      if (!isChatOpen) {
      toast.success(`${data.senderName}: ${data.message}`);

      addNotification({
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        image: data.image || null,
      });
      // 🧠 Request focus change (helps Chrome show notification)
      try {
        window.blur();
      } catch (e) { }

      // 🔔 Browser notification (FIXED VERSION)
      if (Notification.permission === "granted") {
        setTimeout(() => {
          const notification = new Notification(`💬 ${data.senderName}`, {
            body: data.message || "New message",
            icon: "/favicon.ico", // important for visibility
          });

          console.log("NOTIFICATION CREATED:", notification);

          // optional auto-close (IMPORTANT)
          setTimeout(() => {
            notification.close();
          }, 4000);
        }, 100);
      }
    }
    });

    // =========================
    // NEW MESSAGE
    // =========================
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
       const myId = useAuthStore.getState().authUser?._id?.toString();

       // ❗️❗️❗️ MOST IMPORTANT FIX
       if (
         newMessage.senderId?.toString() !== myId &&
         newMessage.receiverId?.toString() !== myId
       ) {
         return; // ignore чужe messages
       }
      const { selectedUser } = get();

      const isChatOpen =
        selectedUser &&
        (newMessage.senderId?.toString() === selectedUser._id?.toString() ||
          newMessage.receiverId?.toString() === selectedUser._id?.toString());

      if (isChatOpen) {
        set((state) => {
          const exists = state.messages.some((m) => m._id === newMessage._id);
          if (exists) return state;

          return {
            messages: [...state.messages, newMessage],
          };
        });

        socket.emit("markAsRead", {
          senderId: newMessage.senderId,
        });
      }

      set((state) => {
        const users = [...state.users];

        const otherUserId =
          newMessage.senderId?.toString() === myId
            ? newMessage.receiverId?.toString()
            : newMessage.senderId?.toString();

        const index = users.findIndex((u) => u._id?.toString() === otherUserId);

        if (index === -1) return state;

        const user = users[index];

        const updatedUser = {
          ...user,
          lastMessage: newMessage.text || "",
          lastMessageId: newMessage._id,
          updatedAt: newMessage.createdAt || new Date().toISOString(),
          unreadCount: isChatOpen ? 0 : (user.unreadCount || 0) + 1,
        };

        users.splice(index, 1);
        users.unshift(updatedUser);

        return { users };
      });
    });

    // =========================
    // READ RECEIPT
    // =========================
    socket.off("messagesRead");

    socket.on("messagesRead", ({ senderId }) => {
      set((state) => ({
        users: state.users.map((u) =>
          u._id === senderId ? { ...u, unreadCount: 0 } : u,
        ),
        messages: state.messages.map((m) =>
          m.senderId === senderId ? { ...m, isRead: true } : m,
        ),
      }));
    });

    // =========================
    // 🔥 MESSAGE EDIT FIX (IMPORTANT)
    // =========================
    socket.off("messageUpdated");

    socket.on("messageUpdated", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m,
        ),
      }));
    });

    socket.off("messageDeleted");

    socket.on("messageDeleted", ({ messageId }) => {
      set((state) => {
        const updatedMessages = state.messages.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, text: "This message was deleted" }
            : m,
        );

        const updatedUsers = state.users.map((u) =>
          u.lastMessageId === messageId
            ? {
              ...u,
              lastMessage: "deleted",
            }
            : u,
        );

        return {
          messages: updatedMessages,
          users: updatedUsers,
        };
      });
    });
    socket.off("sidebarUpdate");
    socket.on("sidebarUpdate", ({ userId, message }) => {
      set((state) => ({
        users: state.users.map((u) =>
          u._id === userId
            ? {
              ...u,
              lastMessage: message.isDeleted ? "deleted" : message.text,
              lastMessageId: message._id,
              updatedAt: message.createdAt || new Date().toISOString(),
            }
            : u,
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("messageUpdated");
    // ✅ ADD THESE
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("newMessageNotification");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
