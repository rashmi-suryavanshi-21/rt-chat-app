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

    const usersWithLastMsg = await Promise.all(
      users.map(async (user) => {
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          isRead: false,
        });

        let lastMessageText = "No messages yet";

        if (lastMsg) {
          if (lastMsg.isDeleted) {
            lastMessageText = "deleted";
          } else if (lastMsg.text?.trim()) {
            lastMessageText = lastMsg.text;
          }
        }

        return {
          ...user.toObject(),
          lastMessage: lastMessageText,
          lastMessageId: lastMsg?._id || null,
          updatedAt: lastMsg?.createdAt || user.createdAt,
          unreadCount,
        };
      })
    );

    usersWithLastMsg.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    res.status(200).json(usersWithLastMsg);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// =========================
// GET MESSAGES
// =========================
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

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

    const senderSocketId = getReceiverSocketId(userToChatId);
    const mySocketId = getReceiverSocketId(myId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", {
        senderId: userToChatId,
        receiverId: myId,
      });
    }

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
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      isScheduled: false,
    });

    const populated = await Message.findById(newMessage._id);

    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populated);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", populated);
    }

    // 🔥 IMPORTANT FIX (SIDEBAR REALTIME UPDATE)
    io.emit("sidebarUpdate", {
      userId: receiverId,
      message: populated,
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// =========================
// SCHEDULE MESSAGE
// =========================
export const scheduleMessage = async (req, res) => {
  try {
    const { receiverId, text, scheduledTime } = req.body;
    const senderId = req.user._id;

    const message = await Message.create({
      senderId,
      receiverId,
      text,
      scheduledTime,
      isScheduled: true,
      isSent: false,
      isDeleted: false,
      isEdited: false,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: "Error scheduling message" });
  }
};

// =========================
// DELETE MESSAGE (FIXED REALTIME)
// =========================
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ error: "Not found" });

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    message.isDeleted = true;
    await message.save();

    // 🔥 REALTIME FIX
    io.to(getReceiverSocketId(message.receiverId)).emit("messageDeleted", {
      messageId: message._id,
    });

    io.to(getReceiverSocketId(message.senderId)).emit("messageDeleted", {
      messageId: message._id,
    });

    res.status(200).json({
      success: true,
      deletedMessageId: message._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// =========================
// UPDATE MESSAGE (FIXED REALTIME + EDIT FLAG)
// =========================
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const message = await Message.findById(id);

    if (!message) return res.status(404).json({ error: "Not found" });

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    message.text = text.trim();
    message.isEdited = true;

    await message.save();

    const updatedMessage = await Message.findById(id);

    // 🔥 REALTIME FIX (IMPORTANT)
    io.to(getReceiverSocketId(message.receiverId)).emit(
      "messageUpdated",
      updatedMessage
    );

    io.to(getReceiverSocketId(message.senderId)).emit(
      "messageUpdated",
      updatedMessage
    );

    res.status(200).json(updatedMessage);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};