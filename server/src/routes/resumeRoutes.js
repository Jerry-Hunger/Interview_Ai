import express from "express";
import {
  formatResumeStream,
  getResumeById,
  getResumeTextById,
  saveResumeText,
} from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import { validateFormatResume, validateResumeId } from "../middlewares/validators/resumeValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/format-resume-stream", authMiddleware(), aiLimiter, validateFormatResume, validate, formatResumeStream);
router.get("/:id", authMiddleware(), validateResumeId, validate, getResumeById);
router.get("/:id/text", authMiddleware(), validateResumeId, validate, getResumeTextById);
router.put("/:id/text", authMiddleware(), validateResumeId, validate, saveResumeText);

export default router;
