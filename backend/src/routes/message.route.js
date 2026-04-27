import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, scheduleMessage, deleteMessage, updateMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

router.post("/schedule", protectRoute, scheduleMessage);

router.delete("/delete/:id", protectRoute, deleteMessage);

router.put("/update/:id", protectRoute, updateMessage);

export default router;
