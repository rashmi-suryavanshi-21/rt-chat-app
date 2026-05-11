import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Block from "../models/block.model.js";
import ChatRequest from "../models/chatRequest.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";
import { generateBotReply } from "../lib/bot.js";

// =========================
// GET USERS (SIDEBAR)
// =========================
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // ACCEPTED REQUESTS
const acceptedRequests = await ChatRequest.find({
  $or: [
    { senderId: loggedInUserId },
    { receiverId: loggedInUserId },
  ],
  status: "accepted",
});

// EXTRACT ACCEPTED USER IDS
const acceptedUserIds = acceptedRequests.map((req) => {

  if (req.senderId.toString() === loggedInUserId.toString()) {
    return req.receiverId;
  }

  return req.senderId;

});

// GET AI BOTS
const botUsers = await User.find({
  isBot: true,
}).select("-password");

// NORMAL USERS
const acceptedUsers = await User.find({
  _id: {
    $in: acceptedUserIds,
    $ne: loggedInUserId,
  },
}).select("-password");

// MERGE USERS + BOTS
const users = [
  ...botUsers,
  ...acceptedUsers,
];

    const usersWithLastMsg = await Promise.all(
      users.map(async (user) => {
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId },
          ],
          deletedFor: { $ne: loggedInUserId },
        })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          senderId: user._id,
          receiverId: loggedInUserId,
          isRead: false,
          deletedFor: { $ne: loggedInUserId },
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
      }),
    );

    usersWithLastMsg.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    res.status(200).json(usersWithLastMsg);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
export const clearChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    // ✅ ONLY THIS NEEDED
    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      },
      {
        $addToSet: { deletedFor: myId },
      },
    );

    res.status(200).json({ message: "Chat cleared" });
  } catch (error) {
    console.log("Clear chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET MESSAGES
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
      { isRead: true },
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $ne: myId }, //for clear chat
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

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
   // FIND RECEIVER
    const receiverUser = await User.findById(receiverId);

    // =========================
    // CHECK ACCEPTED REQUEST
    // =========================

    if (!receiverUser?.isBot) {
      const request = await ChatRequest.findOne({
        $or: [
          {
            senderId,
            receiverId,
            status: "accepted",
          },
          {
            senderId: receiverId,
            receiverId: senderId,
            status: "accepted",
          },
        ],
      });

      if (!request) {
        return res.status(403).json({
          message: "Chat request not accepted",
        });
      }
    }

    // =========================
    // CHECK BLOCKED
    // =========================

    const blocked = await Block.findOne({
      $or: [
        {
          blocker: senderId,
          blocked: receiverId,
        },
        {
          blocker: receiverId,
          blocked: senderId,
        },
      ],
    });

    if (blocked) {
      return res.status(403).json({
        message: "User blocked",
      });
    }
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
    // 🤖 BOT REPLY (STEP 2)
    const receiver = await User.findById(receiverId);

    if (receiver?.isBot) {
      setTimeout(async () => {
        const botReply = await generateBotReply(text, senderId, receiverId);

        const botMessage = await Message.create({
          senderId: receiverId, // bot is sender
          receiverId: senderId,
          text: botReply,
          isRead: false,
        });

        const senderSocketId = getReceiverSocketId(senderId);

        if (senderSocketId) {
          io.to(senderSocketId).emit("newMessage", botMessage);
        }
      }, 800);
    }
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populated);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", populated);
    }

    // =========================
    // 🔔 MESSAGE NOTIFICATION (NEW ADDITION)
    // =========================
    const notificationPayload = {
      senderId,
      receiverId,
      // senderName: req.user.username || "User",
      senderName: req.user.username || req.user.username || "User",
      message: text || "Sent an image",
      image: imageUrl || null,
    };

    // 🔔 NOTIFICATION EVENT (THIS IS MISSING LINK)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessageNotification",
        notificationPayload,
      );
    }
    console.log("receiverSocketId:", receiverSocketId);
    console.log("notificationPayload:", notificationPayload);

    // 🔥 IMPORTANT FIX (SIDEBAR REALTIME UPDATE)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("sidebarUpdate", {
        userId: senderId,
        message: populated,
      });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("sidebarUpdate", {
        userId: receiverId,
        message: populated,
      });
    }

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
    let { text } = req.body;

    // ✅ FORCE STRING
    text = typeof text === "string" ? text : "";

    if (!text.trim()) {
      return res.status(400).json({ error: "Text required" });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Not found" });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    message.text = text.trim();
    message.isEdited = true;

    await message.save();

    const updatedMessage = await Message.findById(id);

    const receiverSocketId = getReceiverSocketId(
      message.receiverId?.toString(),
    );
    const senderSocketId = getReceiverSocketId(message.senderId?.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", updatedMessage);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageUpdated", updatedMessage);
    }

    return res.status(200).json(updatedMessage);
  } catch (err) {
    console.log("🔥 UPDATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    message.pinned = !message.pinned;

    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagePinned", message);
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagePinned", message);
    }

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleStarMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Not found" });

    message.starred = !message.starred;

    await message.save();

    const receiverSocketId = getReceiverSocketId(
      message.receiverId?.toString(),
    );
    const senderSocketId = getReceiverSocketId(message.senderId?.toString());

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageStarred", message);
    }
    console.log("receiver socket:", receiverSocketId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageStarred", message);
    }

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStarredMessages = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    console.log("STARRED API HIT");
    console.log("USER:", req.user._id);

    const messages = await Message.find({
      starred: true,
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "username fullName profilePic")
      .populate("receiverId", "username fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (err) {
    console.log("STARRED ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
