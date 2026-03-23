import jwt from "jsonwebtoken";

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token)
      return res.status(401).json({ msg: "未提供认证令牌" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ msg: "无权限访问" });
      }

      next();
    } catch (err) {
      console.log(err);
      res.status(401).json({ msg: "令牌无效" });
    }
  };
};

export default authMiddleware;
