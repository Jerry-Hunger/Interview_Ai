import express from "express";
import {
  startInterview,
  respondToInterview,
  formatResume,
  concludeInterview,
  getUserInterviews,
  getInterviewById,
} from "../controllers/interviewController.js";
import { generateGeminiResponse } from "../utils/gemini.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/start", startInterview);
router.post("/respond", respondToInterview);
router.post("/summarize-role", async (req, res) => {
  const { prompt } = req.body;

  try {
    const summary = await generateGeminiResponse(prompt);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: "Failed to summarize role" });
  }
});
router.post("/format-resume", formatResume);
router.post("/conclude", authMiddleware(), concludeInterview);
// ✅ Fetch all interviews of logged-in user
router.get("/mine", authMiddleware(), getUserInterviews);
// ✅ Fetch one interview by ID (for detailed results page)
router.get("/:id", authMiddleware(), getInterviewById);

export default router;
