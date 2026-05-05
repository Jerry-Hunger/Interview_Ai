import { body } from "express-validator";

export const validateUpdateProfile = [
  body("companyName").optional().notEmpty().withMessage("公司名称不能为空"),
  body("industry").optional().notEmpty().withMessage("行业不能为空"),
  body("companySize").optional().isIn(["1-10", "11-50", "51-200", "201-500", "500+"]).withMessage("公司规模必须是 1-10、11-50、51-200、201-500 或 500+"),
];
