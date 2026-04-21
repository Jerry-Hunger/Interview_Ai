import { body } from "express-validator";

export const validateStartInterview = [
  body("role").notEmpty().withMessage("职位角色不能为空"),
  body("resume").notEmpty().withMessage("简历内容不能为空"),
];

export const validateRespondInterview = [
  body("chatHistory").isArray().withMessage("对话历史必须是数组"),
  body("answer").notEmpty().withMessage("回答不能为空"),
];

export const validateConcludeInterview = [
  body("history").isArray().withMessage("对话历史必须是数组"),
  body("typeOfInterview").notEmpty().withMessage("面试类型不能为空"),
  body("difficulty").notEmpty().withMessage("难度不能为空"),
];

export const validateSummarizeRole = [
  body("prompt").notEmpty().withMessage("提示词不能为空"),
];

export const validateFormatResume = [
  body("resumeText").notEmpty().withMessage("简历文本不能为空"),
];
