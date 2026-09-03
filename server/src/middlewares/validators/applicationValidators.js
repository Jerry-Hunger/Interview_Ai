import { body, param } from "express-validator";

export const validateCreateApplication = [
  body("jobId").isMongoId().withMessage("无效的职位 ID"),
  body("resumeId").optional().isMongoId().withMessage("无效的简历 ID"),
];

export const validateUpdateStatus = [
  param("applicationId").isMongoId().withMessage("无效的申请 ID"),
  body("status").isIn(["applied", "in-progress", "selected", "final-selected", "rejected"]).withMessage("无效的申请状态"),
  body("approvedThrough").optional().isInt({ min: 0 }).withMessage("批准的轮次必须是正整数"),
];

export const validateAddRoundResult = [
  param("applicationId").isMongoId().withMessage("无效的申请 ID"),
  body("result").isIn(["success", "failure"]).withMessage("结果必须是 success 或 failure"),
  body("roundNumber").isInt({ min: 1 }).withMessage("轮次编号无效"),
  body("interviewId").isMongoId().withMessage("无效的面试 ID"),
];

export const validateJobApplications = [
  param("jobId").isMongoId().withMessage("无效的职位 ID"),
];

export const validateApplicationId = [
  param("applicationId").isMongoId().withMessage("无效的申请 ID"),
];
