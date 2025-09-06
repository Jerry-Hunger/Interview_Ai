import express from "express";
import {
  updateResumeText,
  formatResume,
} from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/update-text", authMiddleware("student"), updateResumeText);
router.post("/format-resume", formatResume);

export default router;
