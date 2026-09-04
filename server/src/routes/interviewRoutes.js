import express from "express";
import {
  startInterviewStream,
  respondToInterviewStream,
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

router.post("/start-stream", authMiddleware("student"), aiLimiter, validateStartInterview, validate, startInterviewStream);
router.post("/respond-stream", authMiddleware("student"), aiLimiter, validateRespondInterview, validate, respondToInterviewStream);
router.post("/conclude-stream", authMiddleware("student"), aiLimiter, validateConcludeInterview, validate, concludeInterviewStream);
router.get("/mine", authMiddleware("student"), getUserInterviews);
router.get("/:id", authMiddleware("student"), getInterviewById);

export default router;
