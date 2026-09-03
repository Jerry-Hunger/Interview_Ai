import express from "express";
import {
  startInterview,
  respondToInterviewStream,
  concludeInterview,
  concludeInterviewStream,
  getUserInterviews,
  getInterviewById,
} from "../controllers/interviewController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import {
  validateStartInterview,
  validateRespondInterview,
  validateConcludeInterview,
} from "../middlewares/validators/interviewValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/start", authMiddleware(), aiLimiter, validateStartInterview, validate, startInterview);
router.post("/respond-stream", authMiddleware(), aiLimiter, validateRespondInterview, validate, respondToInterviewStream);
router.post("/conclude", authMiddleware(), aiLimiter, validateConcludeInterview, validate, concludeInterview);
router.post("/conclude-stream", authMiddleware(), aiLimiter, validateConcludeInterview, validate, concludeInterviewStream);
router.get("/mine", authMiddleware("student"), getUserInterviews);
router.get("/:id", authMiddleware("student"), getInterviewById);

export default router;
