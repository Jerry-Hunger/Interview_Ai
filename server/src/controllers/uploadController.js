// server/src/controllers/uploadController.js
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import {
  uploadFile,
  generateAvatarPath,
  generateResumePath,
  generateLogoPath,
  generatePhotoPath,
  getFileExtension,
  isValidImageType,
  isValidResumeType,
} from "../utils/oss.js";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "请选择图片文件" });
    }

    const file = req.file;
    const userId = req.user.id;

    // Validate file type
    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext)) {
      return res
        .status(400)
        .json({ success: false, error: "不支持的图片格式，仅支持 jpg、png、webp" });
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: "图片大小不能超过 2MB" });
    }

    // Upload to OSS
    const path = generateAvatarPath(userId, ext);
    const url = await uploadFile(file, path);

    // Update user record
    await User.findByIdAndUpdate(userId, { avatarUrl: url });

    res.json({ success: true, url });
  } catch (err) {
    console.error("上传头像失败:", err);
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

    // Validate file type
    const ext = getFileExtension(file.originalname);
    if (!isValidResumeType(ext)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "不支持的简历格式，仅支持 pdf、doc、docx",
        });
    }

    // Validate file size
    if (file.size > MAX_RESUME_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: "简历大小不能超过 5MB" });
    }

    // Upload to OSS
    const path = generateResumePath(userId, ext);
    const url = await uploadFile(file, path);

    // Delete old resume if exists
    const user = await User.findById(userId);
    if (user.resumeId) {
      await Resume.findByIdAndDelete(user.resumeId);
    }

    // Create new resume record
    const resume = new Resume({
      userId,
      fileUrl: url,
      fileName: file.originalname,
      fileType: ext,
    });
    await resume.save();

    // Update user record
    await User.findByIdAndUpdate(userId, { resumeId: resume._id });

    res.json({
      success: true,
      url: resume.fileUrl,
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
      },
    });
  } catch (err) {
    console.error("上传简历失败:", err);
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

    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext)) {
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

    await User.findByIdAndUpdate(userId, { companyLogoUrl: url });

    res.json({ success: true, url });
  } catch (err) {
    console.error("上传 Logo 失败:", err);
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

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = getFileExtension(file.originalname);
      
      if (!isValidImageType(ext)) {
        return res
          .status(400)
          .json({ success: false, error: `第 ${i + 1} 张图片格式不支持，仅支持 jpg、png、webp` });
      }

      if (file.size > MAX_RESUME_SIZE) {
        return res
          .status(400)
          .json({ success: false, error: `第 ${i + 1} 张图片大小不能超过 5MB` });
      }

      const path = generatePhotoPath(userId, ext, i);
      const url = await uploadFile(file, path);
      urls.push(url);
    }

    const user = await User.findById(userId);
    const existingPhotos = user.companyPhotos || [];
    const updatedPhotos = [...existingPhotos, ...urls].slice(0, 10);
    
    await User.findByIdAndUpdate(userId, { companyPhotos: updatedPhotos });

    res.json({ success: true, urls });
  } catch (err) {
    console.error("上传照片失败:", err);
    res.status(500).json({ success: false, error: "上传失败，请稍后重试" });
  }
};