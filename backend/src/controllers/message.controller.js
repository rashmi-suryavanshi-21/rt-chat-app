import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// =========================
// GET USERS (SIDEBAR)
// =========================
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    const usersWithUnread = await Promise.all(
      users.map(async (user) => {
        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          isRead: false,
        });

        return {
          ...user.toObject(),
          unreadCount,
          lastMessage: "",
        };
      })
    );

    res.status(200).json(usersWithUnread);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
// =========================
// GET MESSAGES
// =========================
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // ✅ mark as read in DB
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        isRead: false,
      },
      { isRead: true }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // 🔥 IMPORTANT: notify sender instantly
    const senderSocketId = getReceiverSocketId(userToChatId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        senderId: userToChatId,
        receiverId: myId,
      });
    }

    // 🔥 ALSO notify current user (so sidebar updates instantly)
    const mySocketId = getReceiverSocketId(myId);

    if (mySocketId) {
      io.to(mySocketId).emit("messagesRead", {
        senderId: userToChatId,
        receiverId: myId,
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// =========================
// SEND MESSAGE
// =========================
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isRead: false,
    });

    const populatedMessage = await Message.findById(newMessage._id);

    // send to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    // ALSO send back to sender (important for instant UI sync)
    const senderSocketId = getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// =========================
// MARK AS READ (SOCKET USE)
// =========================
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      {
        senderId,
        receiverId,
        isRead: false,
      },
      { isRead: true }
    );

    const senderSocketId = getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        senderId,
        receiverId,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};