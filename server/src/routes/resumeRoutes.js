import express from "express";
import {
  formatResumeStream,
  getResumeById,
  getResumeTextById,
  saveResumeText,
  listMyResumes,
  setDefaultResume,
  updateResume,
  archiveResume,
} from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import { validateFormatResume, validateResumeId, validateUpdateResume } from "../middlewares/validators/resumeValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/format-resume-stream", authMiddleware("student"), aiLimiter, validateFormatResume, validate, formatResumeStream);
router.get("/", authMiddleware("student"), listMyResumes);
router.patch("/:id/default", authMiddleware("student"), validateResumeId, validate, setDefaultResume);
router.patch("/:id", authMiddleware("student"), validateUpdateResume, validate, updateResume);
router.delete("/:id", authMiddleware("student"), validateResumeId, validate, archiveResume);
router.get("/:id", authMiddleware(), validateResumeId, validate, getResumeById);
router.get("/:id/text", authMiddleware(), validateResumeId, validate, getResumeTextById);
router.put("/:id/text", authMiddleware(), validateResumeId, validate, saveResumeText);

export default router;
