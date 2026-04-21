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
