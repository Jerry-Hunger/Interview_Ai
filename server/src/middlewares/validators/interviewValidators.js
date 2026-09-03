import { body } from "express-validator";

export const validateStartInterview = [
  body("role").notEmpty().withMessage("职位角色不能为空"),
  body("resume").notEmpty().withMessage("简历内容不能为空"),
  body("difficulty").isIn(["beginner", "intermediate", "senior"]).withMessage("难度必须是 beginner、intermediate 或 senior"),
  body("type").isIn(["practice", "company"]).withMessage("类型必须是 practice 或 company"),
  body("resumeId").isMongoId().withMessage("请选择有效的简历"),
  body("applicationId").if(body("type").equals("company")).isMongoId().withMessage("企业面试需要有效的申请 ID"),
];

export const validateRespondInterview = [
  body("chatHistory").isArray().withMessage("对话历史必须是数组"),
  body("answer").notEmpty().withMessage("回答不能为空"),
];

export const validateConcludeInterview = [
  body("history").isArray().withMessage("对话历史必须是数组"),
  body("roundType").optional().isIn(["behavioral", "technical", "hr"]).withMessage("轮次类型必须是 behavioral、technical 或 hr"),
  body("typeOfInterview").optional().isIn(["practice", "company"]).withMessage("面试类型必须是 practice 或 company"),
  body("difficulty").optional().isIn(["beginner", "intermediate", "senior"]).withMessage("难度必须是 beginner、intermediate 或 senior"),
  body("result").optional().isIn(["success", "failure", "quit"]).withMessage("结果必须是 success、failure 或 quit"),
  body("resumeId").isMongoId().withMessage("请选择有效的简历"),
  body("applicationId").if(body("typeOfInterview").equals("company")).isMongoId().withMessage("企业面试需要有效的申请 ID"),
];
