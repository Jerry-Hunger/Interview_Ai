import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

const app = express();

// 信任代理（当使用 Nginx 反向代理时必须）
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
      : ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(apiLimiter);

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API 服务运行中...");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`✅ server running on ${PORT}`));

const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
