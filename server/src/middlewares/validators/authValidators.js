import { body } from "express-validator";

export const validateRegister = [
  body("email").isEmail().withMessage("邮箱格式不正确"),
  body("password").isLength({ min: 6 }).withMessage("密码至少 6 位"),
  body("role").isIn(["student", "company"]).withMessage("角色必须是 student 或 company"),
];

export const validateLogin = [
  body("email").isEmail().withMessage("邮箱格式不正确"),
  body("password").notEmpty().withMessage("密码不能为空"),
];
