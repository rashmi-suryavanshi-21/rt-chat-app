import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { blockUser, unblockUser } from "../controllers/block.controller.js";

const router = express.Router();

router.post(
  "/:id",
  protectRoute,
  blockUser
);

router.delete(
  "/unblock/:id",
  protectRoute,
  unblockUser
);

export default router;