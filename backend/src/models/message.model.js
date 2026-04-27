import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    delivered: {
      type: Boolean,
      default: false,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },

    scheduledTime: {
      type: Date,
      required: function () {
        return this.isScheduled;
      },
    },

    isSent: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ isScheduled: 1, isSent: 1, scheduledTime: 1 });


const Message = mongoose.model("Message", messageSchema);

export default Message;