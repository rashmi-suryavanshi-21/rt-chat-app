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

        // 🔥 SAFE LAST MESSAGE LOGIC (IMPORTANT FIX)
        let lastMessageText = null;
        if (!lastMsg) {
          lastMessageText = "No messages yet";
        } else if (lastMsg.isDeleted) {
          lastMessageText = "deleted";
        } else if (lastMsg.text && lastMsg.text.trim() !== "") {
          lastMessageText = lastMsg.text;
        } else {
          lastMessageText = "No messages yet";
        }

        return {
          ...user.toObject(),
          lastMessage: lastMessageText,
          lastMessageId: lastMsg?._id || null,
          updatedAt: lastMsg?.createdAt || user.createdAt,
          unreadCount,
        };
      }),
    );

    // 🔥 SORT BY RECENT ACTIVITY
    usersWithLastMsg.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    res.status(200).json(usersWithLastMsg);
  } catch (error) {
    console.error("Error fetching users:", error);
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

    // ✅ mark as read in DB
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        isRead: false,
      },
      { isRead: true },
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
      { isRead: true },
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
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error scheduling message" });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: "Not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // 🔥 mark as deleted (DO NOT trust empty text only)
    message.isDeleted = true;
    message.text = "This message was deleted";
    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      deletedMessageId: message._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE MESSAGE
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    //update
    message.text = text.trim();
    message.isEdited = true;

    await message.save();

    // 🔥 REALTIME (IMPORTANT)
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", message);
    }

    res.status(200).json(message);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
