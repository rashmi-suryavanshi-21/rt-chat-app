import Block from "../models/block.model.js";

export const blockUser = async (req, res) => {
  try {

    const blocker = req.user._id;
    const blocked = req.params.id;

    // cannot block self
    if (
      blocker.toString() === blocked
    ) {
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

    res.status(200).json({
      message: "User blocked",
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal server error",
    });

  }
};