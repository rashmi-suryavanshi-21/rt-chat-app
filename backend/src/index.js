import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import healthRoutes from "./routes/health.route.js";
import { app, server } from "./lib/socket.js";
import userRoutes from "./routes/user.route.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { startCronJobs } from "./lib/cronJobs.js";
import requestRoutes from "./routes/request.route.js";
import blockRoutes from "./routes/block.routes.js";
startCronJobs();

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/health", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/block", blockRoutes);


server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
