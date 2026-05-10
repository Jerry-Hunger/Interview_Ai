import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const SENSITIVE_KEYS = new Set(["password", "token", "authorization", "cookie"]);

const redact = winston.format((info) => {
  for (const key in info) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      info[key] = "***";
    }
  }
  return info;
});

/**
 * 自定义控制台输出格式
 *
 * 示例：
 *   2026-05-08 14:30:22 [INFO]: MongoDB connected
 *   2026-05-08 14:30:24 [ERROR]: 开始面试失败
 *     { "error": "DeepSeek API timeout" }
 */
const consoleFormat = combine(
  redact(),
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  colorize({
    level: true,
    colors: { error: "red", warn: "yellow", info: "green", http: "cyan", debug: "blue" },
  }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    let line = `${ts} [${level}]: ${message}`;

    if (stack) {
      line += `\n  ${stack}`;
    }

    // 单次遍历过滤并构建元数据对象
    const obj = {};
    for (const k in meta) {
      const val = meta[k];
      if (val === undefined) continue;
      if (k === "meta" && typeof val === "object" && !Object.keys(val).length) continue;
      obj[k] = val;
    }

    const objKeys = Object.keys(obj);
    if (objKeys.length > 0) {
      const seen = new WeakSet();
      const safe = (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      };
      line += `\n  ${JSON.stringify(obj, safe, 2)}`;
    }

    return line;
  })
);

const winstonLogger = winston.createLogger({
  // 默认 "http" 级别：同时输出 error/warn/info/http，确保请求日志可见
  level: process.env.LOG_LEVEL || "http",
  transports: [new winston.transports.Console({ format: consoleFormat })],
});

/**
 * Pino 风格参数适配 — 将 logger.info({ key: val }, "msg") 转换为 Winston 的 logger.info("msg", { key: val })
 */
const createProxy = (level) => (...args) => {
  if (
    args.length >= 2 &&
    typeof args[0] === "object" &&
    args[0] !== null &&
    !(args[0] instanceof Error) &&
    typeof args[1] === "string"
  ) {
    return winstonLogger[level](args[1], args[0]);
  }
  return winstonLogger[level](...args);
};

const logger = {
  error: createProxy("error"),
  warn: createProxy("warn"),
  info: createProxy("info"),
  http: createProxy("http"),
  verbose: createProxy("verbose"),
  debug: createProxy("debug"),
};

/**
 * Express 5 兼容的 HTTP 请求日志中间件
 * 使用 res.on('finish') 替代 express-winston 的猴子补丁方案
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.url === "/favicon.ico") return;
    const ms = Date.now() - start;
    // 使用 winstonLogger 直接输出，避免被日志级别过滤
    winstonLogger.http(
      `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`
    );
  });
  next();
};

export { httpLogger };
export default logger;
