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

startCronJobs();

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["http://localhost:8080", "http://localhost"] 
      : "http://localhost:5173",
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

// app.use(express.json({ limit: "10mb" }));
// console.log(process.env.CLOUDINARY_CLOUD_NAME)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}
// console.log("MONGO:", process.env.MONGODB_URI);
// console.log("ENV FILE DEBUG:");
// console.log("PORT:", process.env.PORT);
// console.log("MONGO:", process.env.MONGODB_URI);
// console.log("JWT:", process.env.JWT_SECRET);
// console.log("ENV KEYS:", Object.keys(process.env));



server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
