import cron from "node-cron";
import Message from "../models/message.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const startCronJobs = () => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const messages = await Message.find({
      isScheduled: true,
      isSent: false,
      scheduledTime: { $lte: now },
    });

    for (const msg of messages) {
      msg.isSent = true;
      msg.sentAt = new Date();
      await msg.save();

      const receiverSocketId = getReceiverSocketId(msg.receiverId);
      const senderSocketId = getReceiverSocketId(msg.senderId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", msg);
      }

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageSent", msg);
      }
    }
  });
};