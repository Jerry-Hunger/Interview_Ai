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

const router = express.Router();

router.post("/format-resume", formatResume);
router.post("/format-resume-stream", formatResumeStream);
router.get("/:id", authMiddleware(), getResumeById);
router.get("/:id/text", authMiddleware(), getResumeTextById);
router.put("/:id/text", authMiddleware(), saveResumeText);
router.get("/:id/file", getResumeFile);
router.get("/user/:userId", authMiddleware(), getResumeByUserId);

export default router;
