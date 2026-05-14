 import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://rt-chat-app-lovat.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// 🔥 socket map
const userSocketMap = {};
let onlineUsers = new Set();

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.log("❌ No userId in handshake");
    return;
  }

  console.log("User connected:", userId, socket.id);

  // =========================
  // 🔥 AUTO SAVE ONLINE TIME
  // =========================
  const interval = setInterval(async () => {
    try {
      const user = await User.findById(userId);
      if (!user || !user.sessionStart) return;

      const duration = Math.floor(
        (Date.now() - new Date(user.sessionStart)) / 1000
      );

      user.totalOnlineTimeToday =
        (user.totalOnlineTimeToday || 0) + duration;

      user.totalOnlineTime =
        (user.totalOnlineTime || 0) + duration;

      user.sessionStart = new Date();

      await user.save();
    } catch (err) {
      console.log("Auto save error:", err);
    }
  }, 60000);

  // =========================
  // 🔥 USER ONLINE SET
  // =========================
  try {
    const user = await User.findById(userId);

    if (user) {
      const today = new Date().toDateString();

      if (user.lastActiveDate !== today) {
        user.totalOnlineTimeToday = 0;
        user.lastActiveDate = today;
      }

      user.isOnline = true;
      user.sessionStart = new Date();
      user.lastSeen = new Date();

      await user.save();
    }
  } catch (err) {
    console.log("User update error:", err);
  }

  // =========================
  // 🔥 STORE SOCKET
  // =========================
  userSocketMap[userId] = socket.id;
  socket.userId = userId;
  onlineUsers.add(userId);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  io.emit("onlineUsersCount", onlineUsers.size);

  // =========================
  // 🔥 OPTIONAL SESSION CONTROL
  // =========================
  socket.on("start-chat-session", async ({ userId }) => {
    try {
      const user = await User.findById(userId);
      if (user && !user.sessionStart) {
        user.sessionStart = new Date();
        await user.save();
      }
    } catch (err) {
      console.log("session start error:", err);
    }
  });

  socket.on("end-chat-session", async ({ userId }) => {
    try {
      const user = await User.findById(userId);
      if (user && user.sessionStart) {
        const duration = Math.floor(
          (Date.now() - new Date(user.sessionStart)) / 1000
        );

        user.totalOnlineTime += duration;
        user.totalOnlineTimeToday += duration;

        user.sessionStart = null;
        await user.save();
      }
    } catch (err) {
      console.log("session end error:", err);
    }
  });

  // =========================
  // 🔥 TYPING
  // =========================
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("typing", {
      senderId: userId,
    });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("stopTyping", {
      senderId: userId,
    });
  });

  // =========================
  // 🔥 MESSAGE NOTIFICATION
  // =========================
  socket.on("sendMessage", async ({ message, receiverId, senderName }) => {
    const receiverSocketId = userSocketMap[receiverId];

    const payload = {
      senderId: userId,
      receiverId,
      senderName,
      message,
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessageNotification", payload);
    }

    socket.emit("newMessageNotification", payload);

    //  step 1:check if receiver is bot 
    const receiver=await User.findById(receiverId);
    if(receiver?.isBot){
      console.log("Message sent to BOT:",message);
    }
  });
  console.log("HANDSHAKE USERID:", socket.handshake.query.userId);
  // =========================
  // 🔥 MARK AS READ
  // =========================
  socket.on("markAsRead", async ({ senderId }) => {
    const receiverId = userId;
    if (!senderId || !receiverId) return;


    const result = await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );

    const senderSocketId = userSocketMap[senderId];

    if (senderSocketId && result.modifiedCount > 0) {
      io.to(senderSocketId).emit("messagesRead", { senderId });
    }
  });

  // =========================
  // 🔥 DELETE MESSAGE
  // =========================
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("messageDeleted", {
      messageId,
    });
  });

  // =========================
  // 🔥 UPDATE MESSAGE
  // =========================
  socket.on("updateMessage", ({ message, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("messageUpdated", message);
  });

  // =========================
  // 🔥 SCHEDULED MESSAGE
  // =========================
  socket.on("scheduledMessageSent", async ({ messageId, receiverId }) => {
    try {
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        {
          isSent: true,
          sentAt: new Date(),
        },
        { new: true }
      );

      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId && updatedMessage) {
        io.to(receiverSocketId).emit("messageSent", updatedMessage);
      }

      socket.emit("messageSent", updatedMessage);
    } catch (err) {
      console.log("scheduledMessageSent error:", err);
    }
  });

  // =========================
  // 🔥 DISCONNECT (CLEAN + FIXED)
  // =========================
  socket.on("disconnect", async () => {
    console.log("User disconnected:", userId);

    clearInterval(interval);

    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }

    onlineUsers.delete(userId);

    try {
      const user = await User.findById(userId);

      if (user && user.sessionStart) {
        const duration = Math.floor(
          (Date.now() - new Date(user.sessionStart)) / 1000
        );

        const today = new Date().toDateString();

        if (user.lastActiveDate !== today) {
          user.totalOnlineTimeToday = 0;
          user.lastActiveDate = today;
        }

        user.totalOnlineTimeToday += duration;
        user.totalOnlineTime += duration;

        user.sessionStart = null;
        user.isOnline = false;
        user.lastSeen = new Date();

        await user.save();
      }
    } catch (err) {
      console.log("Disconnect error:", err);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    io.emit("onlineUsersCount", onlineUsers.size);
  });
});

export { io, app, server };