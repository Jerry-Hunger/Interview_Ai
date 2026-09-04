import { validationResult } from "express-validator";
import { error } from "../../utils/apiResponse.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return error(res, "请求参数校验失败", 422, errors.array());
};

export default validate;
