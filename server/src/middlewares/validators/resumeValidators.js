import { body, param } from "express-validator";

export const validateFormatResume = [
  body("resumeText").notEmpty().withMessage("简历文本不能为空"),
];

export const validateResumeId = [
  param("id").isMongoId().withMessage("无效的简历 ID"),
];

export const validateUpdateResume = [
  ...validateResumeId,
  body("title").optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage("简历名称长度必须为 1 至 80 个字符"),
];
