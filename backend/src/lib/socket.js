import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// 🔥 socket map
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.log("❌ No userId in handshake");
    return;
  }

  console.log("User connected:", userId, socket.id);

  // store socket
  userSocketMap[userId] = socket.id;
  socket.userId = userId;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  console.log("userSocketMap:", userSocketMap);

  // =========================
  // TYPING
  // =========================
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];

    console.log("typing -> receiverSocketId:", receiverSocketId);

    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("typing", {
      senderId: userId,
    });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];

    console.log("stopTyping -> receiverSocketId:", receiverSocketId);

    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("stopTyping", {
      senderId: userId,
    });
  });

  // =========================
  // MARK AS READ
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
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);

    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };