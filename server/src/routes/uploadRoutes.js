// server/src/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import { uploadAvatar, uploadResume, uploadLogo, uploadPhotos } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { error } from "../utils/apiResponse.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

const uploadPhotosMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const fixFilenameEncoding = (req, res, next) => {
  if (req.file && req.file.originalname) {
    try {
      const fixedName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      req.file.originalname = fixedName;
    } catch (e) {
      // keep original name if conversion fails
    }
  }
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      if (file.originalname) {
        try {
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {}
      }
    });
  }
  next();
};

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, "文件大小不能超过 5MB", 400);
    }
    return error(res, err.message, 400);
  }
  next(err);
};

router.post(
  "/avatar",
  authMiddleware(),
  upload.single("file"),
  handleMulterError,
  fixFilenameEncoding,
  uploadAvatar
);

router.post(
  "/resume",
  authMiddleware(),
  upload.single("file"),
  handleMulterError,
  fixFilenameEncoding,
  uploadResume
);

router.post(
  "/logo",
  authMiddleware("company"),
  upload.single("file"),
  handleMulterError,
  fixFilenameEncoding,
  uploadLogo
);

router.post(
  "/photos",
  authMiddleware("company"),
  uploadPhotosMiddleware.array("files", 10),
  handleMulterError,
  fixFilenameEncoding,
  uploadPhotos
);

export default router;
