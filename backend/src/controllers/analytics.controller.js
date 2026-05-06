  import mongoose from "mongoose";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // =========================
    // TODAY FILTER
    // =========================
    const today = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);


  const now = new Date();

// 👉 week start (Monday)
const weekStart = new Date(now);
const day = weekStart.getDay(); // 0 = Sun

const diff = day === 0 ? -6 : 1 - day; 
weekStart.setDate(now.getDate() + diff);
weekStart.setHours(0, 0, 0, 0);

// 👉 week end
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekStart.getDate() + 7);

    const user = await User.findById(userObjectId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // =========================
    // MESSAGES (TODAY)
    // =========================
    const messages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("senderId", "username")
      .populate("receiverId", "username")
      .sort({ createdAt: 1 });

    // =========================
    // BASIC STATS
    // =========================
    const totalChats = messages.length;

    const sent = messages.filter(
      (m) => m.senderId?._id?.toString() === userObjectId.toString()
    ).length;

    const received = messages.filter(
      (m) => m.receiverId?._id?.toString() === userObjectId.toString()
    ).length;

    // =========================
    // SENT / RECEIVED MAP
    // =========================
    const sentTo = {};
    const receivedFrom = {};
    const chattedWith = new Set();

    messages.forEach((msg) => {
      const senderId = msg.senderId?._id?.toString();
      const receiverId = msg.receiverId?._id?.toString();

      const senderName = msg.senderId?.username || "Unknown";
      const receiverName = msg.receiverId?.username || "Unknown";

      if (senderId === userObjectId.toString()) {
        chattedWith.add(receiverName);
        sentTo[receiverName] = (sentTo[receiverName] || 0) + 1;
      }

      if (receiverId === userObjectId.toString()) {
        chattedWith.add(senderName);
        receivedFrom[senderName] = (receivedFrom[senderName] || 0) + 1;
      }
    });

    // =========================
    // RESPONSE TIME ANALYSIS (FIXED SAFE VERSION)
    // =========================
   
            // =========================
// RESPONSE TIME ANALYSIS (FIXED SAFE)
// =========================


  // =========================
// RESPONSE TIME ANALYSIS (FINAL FIX)
// =========================
const responseMap = {};

messages.forEach((msg) => {
  const senderId = msg.senderId?._id?.toString();
  const receiverId = msg.receiverId?._id?.toString();

  if (!senderId || !receiverId) return;

  const otherUserName =
    senderId === userObjectId.toString()
      ? msg.receiverId?.username
      : msg.senderId?.username;

  // ✅ IMPORTANT FIX
  if (!otherUserName) return;

  // ✅ OBJECT CREATE (ONLY ONCE)
  if (!responseMap[otherUserName]) {
    responseMap[otherUserName] = {
      lastMessageTime: null,
      lastResponseTime: 0
    };
  }

  // ✅ SAFE ACCESS
  if (responseMap[otherUserName].lastMessageTime) {
    const diff =
      new Date(msg.createdAt) -
      new Date(responseMap[otherUserName].lastMessageTime);

    responseMap[otherUserName].lastResponseTime = diff;
  }

  responseMap[otherUserName].lastMessageTime = msg.createdAt;
});
    
 let responseTimeAnalysis = Object.keys(responseMap).map((name) => {
  const time = responseMap[name].lastResponseTime;

  const sec = time / 1000;

  return {
    username: name,
    responseTime: Math.round(time),
    formattedTime: `${Math.round(sec)} sec`,
    status: sec <= 60 ? "Fast" : "Slow"
  };
});

let finalResponseTimeAnalysis = responseTimeAnalysis
  .filter((item) => item.responseTime > 0)
  .sort((a, b) => a.responseTime - b.responseTime)
  .slice(0, 5);
   



     
  
    // =========================
    // TOP CONTACTS
    // =========================
    const topContacts = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userObjectId] },
              "$receiverId",
              "$senderId"
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // =========================
    // TOP SENT / RECEIVED (UNCHANGED)
    // =========================
    const sentStats = await Message.aggregate([
      {
        $match: {
          senderId: userObjectId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $group: { _id: "$receiverId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const receivedStats = await Message.aggregate([
      {
        $match: {
          receiverId: userObjectId,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const totalMessages = sent + received;

    const formatStats = async (stats) => {
      return Promise.all(
        stats.map(async (item) => {
         const u = await User.findById(item._id).select("username");

          return {
            username: u?.username || "Unknown",
            count: item.count,
            percentage: totalMessages
              ? ((item.count / totalMessages) * 100).toFixed(1)
              : 0
          };
        })
      );
    };

    const topSent = await formatStats(sentStats);
    const topReceived = await formatStats(receivedStats);

    const topChatted = await formatStats(topContacts);

    // =========================
    // HOURLY ACTIVITY (UNCHANGED)
    // =========================
   const hourlyRaw = await Message.aggregate([
  {
    $match: {
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      createdAt: { $gte: startOfDay, $lte: endOfDay } // ✅ ADD THIS
    }
  },
      {
        $group: {
          _id: {
            $hour: { date: "$createdAt", timezone: "Asia/Kolkata" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
      const found = hourlyRaw.find((item) => item._id === i);
      return { hour: `${i}:00`, count: found ? Math.floor(found.count) : 0 };
    });

    // =========================
    // ACTIVE DAYS (UNCHANGED)
    // =========================
  const activeDays = await Message.aggregate([
  {
    $match: {
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
      createdAt: { $gte: weekStart, $lt: weekEnd }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
          timezone: "Asia/Kolkata"
        }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const mostActiveDay =
  activeDays.length > 0
    ? {
        day: days[new Date(activeDays[0]._id).getDay()], // ✅ clean name
        count: activeDays[0].count
      }
    : null;

    // =========================
    // ONLINE TIME
    // =========================
   
// =========================
// ONLINE TIME (SAFE FIX)
// =========================
// =========================
// ONLINE TIME (FINAL FIX WITH DAILY RESET)
// =========================


// =========================
// ONLINE TIME (FINAL CLEAN FIX)
// =========================

let totalOnlineSeconds = user.totalOnlineTimeToday || 0;

// 👉 agar user abhi online hai
if (user.isOnline && user.sessionStart) {
  const currentSession = Math.floor(
    (Date.now() - new Date(user.sessionStart)) / 1000
  );

  totalOnlineSeconds += currentSession;
}


    // =========================
    // FINAL RESPONSE
    // =========================
    return res.json({
  isOnline: user.isOnline || false,
  lastSeen: user.lastSeen || null,

 totalOnlineTime: totalOnlineSeconds,

  totalChats,
  sent,
  received,

  sentTo,
  receivedFrom,
  chattedWith: Array.from(chattedWith),

  topContacts,
  topSent,
  topReceived,
  topChatted,

  hourlyActivity,
  mostActiveDay,

  responseTimeAnalysis: finalResponseTimeAnalysis
});
  } 
  
  catch (error) {
  console.log("🔥 Analytics ERROR FULL:", error);
  console.log("🔥 MESSAGE:", error.message);
  console.log("🔥 STACK:", error.stack);

  return res.status(500).json({
    message: error.message
  });
}
 
};