import logger from "../utils/logger.js";
import { error as sendError } from "../utils/apiResponse.js";

const errorHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    res.end();
    return;
  }

  let status = 500;
  let message = "服务器内部错误";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "无效的 ID 格式";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} 已存在`;
  } else if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "令牌无效";
  } else if (err.name === "TokenExpiredError") {
    status = 401;
    message = "令牌已过期";
  }

  if (status === 500) {
    logger.error({ err: err.stack || err.message }, "未处理错误");
  }

  sendError(res, message, status);
};

export default errorHandler;
