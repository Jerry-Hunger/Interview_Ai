// server/src/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import { uploadAvatar, uploadResume } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

router.post(
  "/avatar",
  authMiddleware(),
  upload.single("file"),
  uploadAvatar
);

router.post(
  "/resume",
  authMiddleware(),
  upload.single("file"),
  uploadResume
);

export default router;