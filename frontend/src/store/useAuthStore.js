import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

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
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      // toast.error(error.response.data.message);
      console.log("Signup error:", error);

  const message =
    error?.response?.data?.message || "Something went wrong";

  console.error(message);
    } finally {
      set({ isSigningUp: false });
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
      toast.error(error.response?.data?.message || error.message);
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
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      if (data.profilePic) {
        toast.success("Profile picture updated");
      } else if (data.bio !== undefined) {
        toast.success("Update Successful");
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // connectSocket: () => {
  //   const { authUser, socket } = get();

  //   if (!authUser) return;

  //   // avoid multiple sockets
  //   if (socket && socket.connected) return;

  //   const newSocket = io(BASE_URL, {
  //     query: {
  //       userId: authUser._id,
  //     },
  //     transports: ["websocket"],
  //   });

  //   set({ socket: newSocket });

  //   newSocket.on("connect", () => {
  //     console.log("✅ socket connected:", newSocket.id);
  //   });

  //   newSocket.on("getOnlineUsers", (userIds) => {
  //     set({ onlineUsers: userIds });
  //   });
  // },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) return;

    if (socket?.connected) return;

    if (!SOCKET_URL) {
      console.error("Missing VITE_SOCKET_URL");
      return;
    }
    const newSocket = io(SOCKET_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ SOCKET CONNECTED:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.log("❌ SOCKET ERROR:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ SOCKET DISCONNECTED:", reason);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("ONLINE USERS:", userIds);
      set({ onlineUsers: userIds });
    });

    set({ socket: newSocket });
  }, 




  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
      socket.off();
      set({ socket: null });
    }
  },
}));
