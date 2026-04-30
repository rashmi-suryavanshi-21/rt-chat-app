import express from "express";
import { searchUsers ,getUserProfile,  updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/:username", protectRoute, getUserProfile);
router.put("/update", protectRoute, updateProfile);

export default router;