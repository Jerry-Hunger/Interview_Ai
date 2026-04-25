import { body, param } from "express-validator";

export const validateCreateApplication = [
  body("jobId").isMongoId().withMessage("无效的职位 ID"),
];

export const validateUpdateStatus = [
  param("applicationId").isMongoId().withMessage("无效的申请 ID"),
  body("status").isIn(["applied", "in-progress", "selected", "final-selected", "rejected"]).withMessage("无效的申请状态"),
];

export const validateAddRoundResult = [
  param("applicationId").isMongoId().withMessage("无效的申请 ID"),
  body("result").isIn(["success", "failure"]).withMessage("结果必须是 success 或 failure"),
  body("roundNumber").isInt({ min: 0 }).withMessage("轮次编号无效"),
];
