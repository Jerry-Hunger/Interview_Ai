import express from "express";
import {
  startInterview,
  respondToInterview,
  respondToInterviewStream,
  formatResume,
  concludeInterview,
  getUserInterviews,
  getInterviewById,
} from "../controllers/interviewController.js";
import { generateDeepSeekResponse } from "../utils/deepseek.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", startInterview);
router.post("/respond", respondToInterview);
router.post("/respond-stream", respondToInterviewStream);
router.post("/summarize-role", async (req, res) => {
  const { prompt } = req.body;

  try {
    const summary = await generateDeepSeekResponse(prompt);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: "职位总结生成失败" });
  }
});
router.post("/format-resume", formatResume);
router.post("/conclude", authMiddleware(), concludeInterview);
router.get("/mine", authMiddleware(), getUserInterviews);
router.get("/:id", authMiddleware(), getInterviewById);

export default router;
