import express, { application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/company", companyRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API 服务运行中...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ 服务器运行在端口 ${PORT}`));
