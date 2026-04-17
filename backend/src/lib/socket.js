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

const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (!userId) return;

  userSocketMap[userId] = socket.id;
  socket.userId = userId;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  console.log("userSocketMap:", userSocketMap);

  // =========================
  // MARK AS READ (FIXED)
  // =========================
  socket.on("markAsRead", async ({ senderId }) => {
    const receiverId = socket.userId;
    if (!senderId || !receiverId) return;

    const result = await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );

    const senderSocketId = userSocketMap[senderId];

    if (senderSocketId && result.modifiedCount > 0) {
      io.to(senderSocketId).emit("messagesRead", {
        senderId,
      });
    }
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("typing", ({ receiverId }) => {
  const receiverSocketId = userSocketMap[receiverId];

  console.log("receiverSocketId:", receiverSocketId);

  if (!receiverSocketId) return;

  io.to(receiverSocketId).emit("typing", {
    senderId: socket.userId,
  });
});
// ---
  socket.on("typing", (data) => {
  console.log("🔥 typing received from frontend:", data);
});
socket.on("stopTyping", ({ receiverId }) => {
  const receiverSocketId = userSocketMap[receiverId];

  console.log("receiverSocketId stop:", receiverSocketId);

  if (!receiverSocketId) return;

  io.to(receiverSocketId).emit("stopTyping", {
    senderId: socket.userId,
  });
});
// --
socket.on("stopTyping", (data) => {
  console.log("🛑 stopTyping received:", data);
});
socket.on("markAsRead", async ({ senderId }) => {
  const receiverId = socket.userId;
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
});


export { io, app, server };