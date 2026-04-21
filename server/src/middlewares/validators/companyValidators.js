import { body } from "express-validator";

export const validateUpdateProfile = [
  body("companyName").optional().notEmpty().withMessage("公司名称不能为空"),
  body("industry").optional().notEmpty().withMessage("行业不能为空"),
  body("companySize").optional().notEmpty().withMessage("公司规模不能为空"),
];
