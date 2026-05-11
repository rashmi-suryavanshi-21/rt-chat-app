import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { blockUser } from "../controllers/block.controller.js";

const router = express.Router();

router.post(
  "/:id",
  protectRoute,
  blockUser
);

export default router;