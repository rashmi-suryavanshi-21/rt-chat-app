import ChatRequest from "../models/chatRequest.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    // cannot send request to self
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        message: "Cannot send request to yourself",
      });
    }

    // already exists
    const existing = await ChatRequest.findOne({
      
  $or: [
    {
      senderId,
      receiverId,
    },
    {
      senderId: receiverId,
      receiverId: senderId,
    },
  ],
  status: {
    $in: ["pending", "accepted"],
  },
});

console.log(existing);
    if (existing) {
      return res.status(400).json({
        message: "Request already exists",
      });
    }

    const request = await ChatRequest.create({
      senderId,
      receiverId,
      status: "pending",
    });
    const populatedRequest = await ChatRequest.findById(request._id)
  .populate("senderId", "fullName profilePic username");

    const receiverSocketId = getReceiverSocketId(receiverId);

if (receiverSocketId) {
  io.to(receiverSocketId).emit("newRequest", populatedRequest);
}
    res.status(201).json(request);

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const acceptRequest = async (req, res) => {
  try {

    const requestId = req.params.id;

    const request = await ChatRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "accepted";

    await request.save();

    const senderSocketId = getReceiverSocketId(
  request.senderId.toString()
);

if (senderSocketId) {
  io.to(senderSocketId).emit(
    "requestAccepted",
    {
      userId: request.receiverId,
    }
  );
}

    res.status(200).json({
      message: "Request accepted",

  userId:
    request.senderId.toString() === req.user._id.toString()
      ? request.receiverId.toString()
      : request.senderId.toString(),
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const rejectRequest = async (req, res) => {
  try {

    const requestId = req.params.id;

    console.log("Reject request id:", requestId);

    const deleted = await ChatRequest.findByIdAndDelete(requestId);

    console.log("Deleted:", deleted);

    res.status(200).json({
      message: "Request rejected",
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getPendingRequests = async (req, res) => {
  try {

    const requests = await ChatRequest.find({
      receiverId: req.user._id,
      status: "pending",
    }).populate("senderId", "fullName profilePic username");

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getRequestStatus = async (req, res) => {
  try {

    const currentUserId = req.user._id;
    const otherUserId = req.params.id;

    const request = await ChatRequest.findOne({
      $or: [
        {
          senderId: currentUserId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: currentUserId,
        },
      ],
    });

    if (!request) {
      return res.status(200).json({
        status: null,
      });
    }

    res.status(200).json({
      status: request.status,
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getSentRequests = async (req, res) => {
  try {

    const requests = await ChatRequest.find({
      senderId: req.user._id,

      hiddenFor: {
    $ne: req.user._id,
  },
    }).populate(
      "receiverId",
      "fullName username profilePic"
    );

    res.status(200).json(requests);

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const hideRequest = async (req, res) => {
  try {

    const requestId = req.params.id;

    const request = await ChatRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    // already hidden
    if (
      request.hiddenFor.includes(req.user._id)
    ) {
      return res.status(200).json({
        message: "Already hidden",
      });
    }

    request.hiddenFor.push(req.user._id);

    await request.save();

    res.status(200).json({
      message: "Request hidden",
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal server error",
    });

  }
};
export const removeConnection = async (req, res) => {
  try {

    const currentUserId = req.user._id;
    const otherUserId = req.params.id;

    const deleted = await ChatRequest.findOneAndDelete({
      $or: [
        {
          senderId: currentUserId,
          receiverId: otherUserId,
          status: "accepted",
        },
        {
          senderId: otherUserId,
          receiverId: currentUserId,
          status: "accepted",
        },
      ],
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Connection not found",
      });
    }

    res.status(200).json({
      message: "Connection removed",
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal server error",
    });

  }
};

export const checkConnection = async (req, res) => {
  try {

    const currentUserId = req.user._id;
    const otherUserId = req.params.id;

    const connection = await ChatRequest.findOne({
      $or: [
        {
          senderId: currentUserId,
          receiverId: otherUserId,
          status: "accepted",
        },
        {
          senderId: otherUserId,
          receiverId: currentUserId,
          status: "accepted",
        },
      ],
    });

    res.status(200).json({
      isConnected: !!connection,
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal server error",
    });

  }
};