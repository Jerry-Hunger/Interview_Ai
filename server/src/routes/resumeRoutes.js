import express from "express";
import {
  formatResume,
  formatResumeStream,
  getResumeById,
  getResumeByUserId,
  getResumeTextById,
  getResumeFile,
  saveResumeText,
} from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import { validateFormatResume, validateResumeId, validateUserId } from "../middlewares/validators/resumeValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/format-resume", authMiddleware(), aiLimiter, validateFormatResume, validate, formatResume);
router.post("/format-resume-stream", authMiddleware(), aiLimiter, validateFormatResume, validate, formatResumeStream);
router.get("/:id", authMiddleware(), validateResumeId, validate, getResumeById);
router.get("/:id/text", authMiddleware(), validateResumeId, validate, getResumeTextById);
router.put("/:id/text", authMiddleware(), validateResumeId, validate, saveResumeText);
router.get("/:id/file", authMiddleware(), validateResumeId, validate, getResumeFile);
router.get("/user/:userId", authMiddleware(), validateUserId, validate, getResumeByUserId);

export default router;
