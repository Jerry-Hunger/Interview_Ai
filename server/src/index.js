import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
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
import logger, { httpLogger } from "./utils/logger.js";

const app = express();

// 信任代理（当使用 Nginx 反向代理时必须）
app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());
app.use(httpLogger);
app.use("/api", apiLimiter);

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

app.get("/health", (_req, res) => {
  // 健康检查同时确认 API 进程和 MongoDB 连接均已就绪。
  const isDatabaseReady = mongoose.connection.readyState === 1;
  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? "ok" : "database_unavailable",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info("Server running at PORT: " + PORT));

/** 优雅关闭标记，防止重复触发 */
let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`收到 ${signal}，正在关闭...`);
  server.close(async () => {
    await mongoose.connection.close();
    logger.info("服务已停止");
    process.exit(0);
  });
  // 3 秒后强制退出，避免卡死
  setTimeout(() => {
    logger.warn("强制退出");
    process.exit(1);
  }, 3000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
