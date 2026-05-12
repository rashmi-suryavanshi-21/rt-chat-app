import { getReceiverSocketId, io } from "../lib/socket.js";
import Block from "../models/block.model.js";
import ChatRequest from "../models/chatRequest.model.js";

export const blockUser = async (req, res) => {
  try {
    const blocker = req.user._id;
    const blocked = req.params.id;

    // cannot block self
    if (blocker.toString() === blocked) {
      return res.status(400).json({
        message: "Cannot block yourself",
      });
    }

    // already blocked
    const existing = await Block.findOne({
      blocker,
      blocked,
    });

    if (existing) {
      return res.status(400).json({
        message: "User already blocked",
      });
    }

    await Block.create({
      blocker,
      blocked,
    });

    await ChatRequest.deleteMany({
  $or: [
    { senderId: blocker, receiverId: blocked },
    { senderId: blocked, receiverId: blocker },
  ],
});


    const receiverSocketId = getReceiverSocketId(blocked);

      if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "userBlocked",
        {
          blockerId: blocker.toString(),
        }
      );
    }

     return res.status(200).json({
      message: "User blocked",
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const blocker = req.user._id;
    const blocked = req.params.id;

    await Block.findOneAndDelete({
      blocker,
      blocked,
    });

    const receiverSocketId = getReceiverSocketId(blocked);


    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "userUnblocked",
        {
          blockerId: blocker.toString(),
        }
      );
    }

     return res.status(200).json({
      message: "User unblocked",
    });


  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
