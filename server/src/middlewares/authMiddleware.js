import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import { error } from "../utils/apiResponse.js";

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    // 保留 Bearer 兼容旧客户端；新客户端只依赖 HttpOnly Cookie。
    const token = req.cookies?.access_token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token)
      return error(res, "未提供认证令牌", 401);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return error(res, "无权限访问", 403);
      }

      next();
    } catch (err) {
      logger.warn({ err }, "JWT 验证失败");
      return error(res, "令牌无效", 401);
    }
  };
};

export default authMiddleware;
