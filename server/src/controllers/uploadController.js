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
import { success, error } from "../utils/apiResponse.js";
import { uploadCompanyPhotosWithRollback } from "../services/photoUploadService.js";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "请选择图片文件", 400);
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
      return error(res, "不支持的图片格式，仅支持 jpg、png、webp", 400);
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return error(res, "图片大小不能超过 2MB", 400);
    }

    const path = generateAvatarPath(userId, ext);
    const url = await uploadFile(file, path);

    const ProfileModel = user.role === "student" ? Student : Company;
    await ProfileModel.findByIdAndUpdate(userId, { avatarUrl: url });

    success(res, { url });
  } catch (err) {
    logger.error({ err }, "上传头像失败");
    error(res, "上传失败，请稍后重试");
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "请选择简历文件", 400);
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "student") {
      return error(res, "只有学生可以上传简历", 400);
    }

    const ext = getFileExtension(file.originalname);
    if (!isValidResumeType(ext) || !isValidResumeUpload(file.buffer, ext)) {
      return error(res, "不支持的简历格式，仅支持 pdf、doc、docx", 400);
    }

    if (file.size > MAX_RESUME_SIZE) {
      return error(res, "简历大小不能超过 5MB", 400);
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

    success(res, {
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
    error(res, "上传失败，请稍后重试");
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "请选择图片文件", 400);
    }

    const file = req.file;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "company") {
      return error(res, "只有企业可以上传 Logo", 400);
    }

    const ext = getFileExtension(file.originalname);
    if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
      return error(res, "不支持的图片格式，仅支持 jpg、png、webp", 400);
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return error(res, "图片大小不能超过 2MB", 400);
    }

    const path = generateLogoPath(userId, ext);
    const url = await uploadFile(file, path);

    await Company.findByIdAndUpdate(userId, { companyLogoUrl: url });

    success(res, { url });
  } catch (err) {
    logger.error({ err }, "上传 Logo 失败");
    error(res, "上传失败，请稍后重试");
  }
};

export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return error(res, "请选择图片文件", 400);
    }

    const files = req.files;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.role !== "company") {
      return error(res, "只有企业可以上传照片", 400);
    }

    // 先完整校验和检查配额，避免部分上传成功后产生无法关联的 OSS 文件。
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = getFileExtension(file.originalname);

      if (!isValidImageType(ext) || !isValidImageUpload(file.buffer, ext)) {
        return error(res, `第 ${i + 1} 张图片格式不支持，仅支持 jpg、png、webp`, 400);
      }

      if (file.size > MAX_RESUME_SIZE) {
        return error(res, `第 ${i + 1} 张图片大小不能超过 5MB`, 400);
      }
    }

    const company = await Company.findById(userId);
    if (!company) {
      return error(res, "企业信息不存在", 404);
    }
    const existingPhotos = company.companyPhotos || [];
    if (existingPhotos.length + files.length > 10) {
      return error(res, `企业照片最多 10 张，当前还可上传 ${10 - existingPhotos.length} 张`, 400);
    }

    const urls = await uploadCompanyPhotosWithRollback({
      files,
      userId,
      existingPhotos,
      uploadFile,
      deleteFile,
      generatePhotoPath,
      getFileExtension,
      savePhotos: (photos) => Company.findByIdAndUpdate(userId, { companyPhotos: photos }),
    });
    success(res, { urls });
  } catch (err) {
    logger.error({ err }, "上传照片失败");
    error(res, "上传失败，请稍后重试");
  }
};
