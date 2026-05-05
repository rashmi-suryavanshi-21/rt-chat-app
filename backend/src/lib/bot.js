import axios from "axios";
import Message from "../models/message.model.js";

export const generateBotReply = async (message, senderId, botId) => {
  try {
    // 🧠 fetch last 10 messages between user & bot
    const history = await Message.find({
      $or: [
        { senderId: senderId, receiverId: botId },
        { senderId: botId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // convert to AI format
    const formattedHistory = history.reverse().map((msg) => ({
      role: msg.senderId.toString() === botId.toString() ? "assistant" : "user",
      content: msg.text,
    }));

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a smart, friendly assistant inside a chat app. Keep replies short and natural.",
          },
          ...formattedHistory,
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.log("Groq error:", err?.response?.data || err.message);
    return "⚠️ AI memory error.";
  }
};