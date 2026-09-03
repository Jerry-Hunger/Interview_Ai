import Student from "../models/Student.js";
import Company from "../models/Company.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import crypto from "crypto";
import logger from "../utils/logger.js";
import {
  uploadFile,
  deleteFile,
  generateAvatarPath,
  generateResumePath,
  generateLogoPath,
  generatePhotoPath,
  getFileExtension,
  isValidImageType,
  isValidResumeType,
} from "../utils/oss.js";
import { isValidImageUpload, isValidResumeUpload } from "../utils/fileValidation.js";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "请选择图片文件" });
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
      return res
        .status(400)
        .json({ success: false, error: "不支持的图片格式，仅支持 jpg、png、webp" });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: "图片大小不能超过 2MB" });
    }

    const path = generateAvatarPath(userId, ext);
    const url = await uploadFile(file, path);

    const ProfileModel = user.role === "student" ? Student : Company;
    await ProfileModel.findByIdAndUpdate(userId, { avatarUrl: url });

    res.json({ success: true, url });
  } catch (err) {
    logger.error({ err }, "上传头像失败");
    res.status(500).json({ success: false, error: "上传失败，请稍后重试" });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "请选择简历文件" });
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "student") {
      return res.status(400).json({ success: false, error: "只有学生可以上传简历" });
    }

    const ext = getFileExtension(file.originalname);
    if (!isValidResumeType(ext) || !isValidResumeUpload(file.buffer, ext)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "不支持的简历格式，仅支持 pdf、doc、docx",
        });
    }

    if (file.size > MAX_RESUME_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: "简历大小不能超过 5MB" });
    }

    const path = generateResumePath(userId, ext);
    const url = await uploadFile(file, path);
    const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");

    const resume = new Resume({
      studentId: userId,
      fileUrl: url,
      fileKey: path,
      fileName: file.originalname,
      title: req.body.title?.trim() || file.originalname,
      fileType: ext,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
    });
    await resume.save();

    const student = await Student.findById(userId);
    // 首份简历自动设为默认；后续上传保留用户当前选择，避免改变投递和练习习惯。
    const shouldSetAsDefault = !student?.defaultResumeId && !student?.resumeId;
    if (shouldSetAsDefault) {
      await Student.findByIdAndUpdate(
        userId,
        { defaultResumeId: resume._id, $unset: { resumeId: 1 } },
        { runValidators: true }
      );
    }

    res.json({
      success: true,
      url: resume.fileUrl,
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        title: resume.title,
        isDefault: shouldSetAsDefault,
      },
    });
  } catch (err) {
    logger.error({ err }, "上传简历失败");
    res.status(500).json({ success: false, error: "上传失败，请稍后重试" });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "请选择图片文件" });
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "company") {
      return res.status(400).json({ success: false, error: "只有企业可以上传 Logo" });
    }

    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
      return res
        .status(400)
        .json({ success: false, error: "不支持的图片格式，仅支持 jpg、png、webp" });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: "图片大小不能超过 2MB" });
    }

    const path = generateLogoPath(userId, ext);
    const url = await uploadFile(file, path);

    await Company.findByIdAndUpdate(userId, { companyLogoUrl: url });

    res.json({ success: true, url });
  } catch (err) {
    logger.error({ err }, "上传 Logo 失败");
    res.status(500).json({ success: false, error: "上传失败，请稍后重试" });
  }
};

export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "请选择图片文件" });
    }

    const files = req.files;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "company") {
      return res.status(400).json({ success: false, error: "只有企业可以上传照片" });
    }

    // 先完整校验和检查配额，避免部分上传成功后产生无法关联的 OSS 文件。
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = getFileExtension(file.originalname);

      if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
        return res
          .status(400)
          .json({ success: false, error: `第 ${i + 1} 张图片格式不支持，仅支持 jpg、png、webp` });
      }

      if (file.size > MAX_RESUME_SIZE) {
        return res
          .status(400)
          .json({ success: false, error: `第 ${i + 1} 张图片大小不能超过 5MB` });
      }
    }

    const company = await Company.findById(userId);
    if (!company) {
      return res.status(404).json({ success: false, error: "企业信息不存在" });
    }
    const existingPhotos = company.companyPhotos || [];
    if (existingPhotos.length + files.length > 10) {
      return res.status(400).json({
        success: false,
        error: `企业照片最多 10 张，当前还可上传 ${10 - existingPhotos.length} 张`,
      });
    }

    const uploadResults = await Promise.allSettled(files.map(async (file, index) => {
      const ext = getFileExtension(file.originalname);
      const path = generatePhotoPath(userId, ext, index);
      const url = await uploadFile(file, path);
      return { path, url };
    }));
    const successfulUploads = uploadResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    if (uploadResults.some((result) => result.status === "rejected")) {
      // 任一文件失败时回滚已成功对象，避免留下不可见的 OSS 孤儿文件。
      await Promise.allSettled(successfulUploads.map((upload) => deleteFile(upload.path)));
      throw new Error("部分企业照片上传失败");
    }

    const updatedPhotos = [...existingPhotos, ...successfulUploads.map((upload) => upload.url)];

    try {
      await Company.findByIdAndUpdate(userId, { companyPhotos: updatedPhotos });
    } catch (err) {
      await Promise.allSettled(successfulUploads.map((upload) => deleteFile(upload.path)));
      throw err;
    }

    res.json({ success: true, urls: successfulUploads.map((upload) => upload.url) });
  } catch (err) {
    logger.error({ err }, "上传照片失败");
    res.status(500).json({ success: false, error: "上传失败，请稍后重试" });
  }
};
