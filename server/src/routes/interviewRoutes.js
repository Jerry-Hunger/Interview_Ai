import express from "express";
import {
  startInterview,
  respondToInterview,
  respondToInterviewStream,
  concludeInterview,
  concludeInterviewStream,
  getUserInterviews,
  getInterviewById,
  summarizeRole,
} from "../controllers/interviewController.js";
import { formatResume } from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import {
  validateStartInterview,
  validateRespondInterview,
  validateConcludeInterview,
  validateSummarizeRole,
  validateFormatResume,
} from "../middlewares/validators/interviewValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/start", authMiddleware(), aiLimiter, validateStartInterview, validate, startInterview);
router.post("/respond", authMiddleware(), aiLimiter, validateRespondInterview, validate, respondToInterview);
router.post("/respond-stream", authMiddleware(), aiLimiter, validateRespondInterview, validate, respondToInterviewStream);
router.post("/summarize-role", authMiddleware(), aiLimiter, validateSummarizeRole, validate, summarizeRole);
router.post("/format-resume", authMiddleware(), aiLimiter, validateFormatResume, validate, formatResume);
router.post("/conclude", authMiddleware(), aiLimiter, validateConcludeInterview, validate, concludeInterview);
router.post("/conclude-stream", authMiddleware(), aiLimiter, validateConcludeInterview, validate, concludeInterviewStream);
router.get("/mine", authMiddleware(), getUserInterviews);
router.get("/:id", authMiddleware(), getInterviewById);

export default router;
