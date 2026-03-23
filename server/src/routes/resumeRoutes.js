import express from "express";
import {
  updateResumeText,
  formatResume,
  getResumeById,
  getResumeByUserId,
} from "../controllers/resumeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/update-text", authMiddleware("student"), updateResumeText);
router.post("/format-resume", formatResume);
router.get("/:id", authMiddleware(), getResumeById);
router.get("/user/:userId", authMiddleware(), getResumeByUserId);

export default router;
