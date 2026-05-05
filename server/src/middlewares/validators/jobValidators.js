import { body, param } from "express-validator";

export const validateCreateJob = [
  body("title").notEmpty().withMessage("职位标题不能为空"),
  body("description").notEmpty().withMessage("职位描述不能为空"),
  body("rounds").isArray({ min: 1 }).withMessage("至少需要一个面试轮次"),
  body("rounds.*.type").isIn(["technical", "behavioral", "hr"]).withMessage("轮次类型必须是 technical、behavioral 或 hr"),
  body("rounds.*.difficulty").isIn(["beginner", "intermediate", "senior"]).withMessage("轮次难度必须是 beginner、intermediate 或 senior"),
];

export const validateApplyJob = [
  param("jobId").isMongoId().withMessage("无效的职位 ID"),
];
