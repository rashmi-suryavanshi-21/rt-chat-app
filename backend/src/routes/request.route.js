import express from "express";

import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getPendingRequests,
  getRequestStatus,
  getSentRequests,
  removeConnection,
  hideRequest,
  checkConnection,
} from "../controllers/request.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

console.log("Request route loaded");

const router = express.Router();

router.post("/send/:id", protectRoute, sendRequest);

router.put("/accept/:id", protectRoute, acceptRequest);

router.delete("/reject/:id", protectRoute, rejectRequest);

router.get("/pending", protectRoute, getPendingRequests);

// router.get("/pending", (req, res) => {
//   console.log("PENDING ROUTE HIT");
//   res.json([]);
// });

router.get("/status/:id", protectRoute, getRequestStatus);

router.get("/sent", protectRoute, getSentRequests);

router.put("/hide/:id", protectRoute, hideRequest);

router.delete("/remove/:id", protectRoute, removeConnection);

router.get(
  "/check/:id",
  protectRoute,
  checkConnection
);

export default router;