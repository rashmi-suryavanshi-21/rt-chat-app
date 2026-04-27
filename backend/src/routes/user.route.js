import express from "express";
import { searchUsers ,getUserProfile} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/:username", protectRoute, getUserProfile);

export default router;