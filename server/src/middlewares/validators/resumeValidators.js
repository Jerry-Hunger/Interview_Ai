import { body, param } from "express-validator";

export const validateFormatResume = [
  body("resumeText").notEmpty().withMessage("简历文本不能为空"),
];

export const validateResumeId = [
  param("id").isMongoId().withMessage("无效的简历 ID"),
];

export const validateUserId = [
  param("userId").isMongoId().withMessage("无效的用户 ID"),
];

// 简历文件类型校验（上传时使用）
export const validateResumeFileType = [
  body("fileType").optional().isIn(["pdf", "doc", "docx"]).withMessage("文件类型必须是 pdf、doc 或 docx"),
];
