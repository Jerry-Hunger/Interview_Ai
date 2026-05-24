[根目录](../CLAUDE.md) > **server**

# server/ -- 服务端模块

> Express 5 + Mongoose 8 + ESM，纯 JavaScript。

## 模块职责

后端 REST API 服务，处理认证、面试（SSE 流式）、职位、简历、申请、企业管理。

## 入口与启动

- **入口**: `src/index.js` | **端口**: `PORT || 5000` | **开发**: `npm run dev` (nodemon)

## 关键模式

### SSE 流式传输

```js
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");
res.setHeader("X-Accel-Buffering", "no"); // Nginx 反向代理必须
for await (const chunk of streamDeepSeekResponse(prompt)) {
  res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
}
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
```

### 统一响应 / 日志 / 邮件

```js
import { success, error } from "../utils/apiResponse.js";
success(res, { application }, 201);  // { success: true, ...data }
error(res, "服务器错误");             // { success: false, error: msg }

import logger from "../utils/logger.js";
logger.info({ host, port }, "消息");   // Pino 风格，敏感字段自动脱敏

import { sendInterviewApprovalEmail } from "../utils/emailService.js";
// applied -> in-progress 时自动触发，DNS 直连绕过代理
```

### 申请状态流转

```
applied -> in-progress (企业批准，发邮件) -> selected/rejected -> final-selected
```
- `approvedThrough` 追踪已批准轮次数，`addRoundResult` 是唯一流转入口

## 对外接口

| 前缀 | 关键端点 | 中间件 |
|------|---------|--------|
| `/api/auth` | register, login, me, profile, github/callback | authMiddleware (部分) |
| `/api/interview` | start, respond-stream, conclude-stream, mine | authMiddleware + aiLimiter |
| `/api/jobs` | CRUD, company, apply | authMiddleware (部分) |
| `/api/resume` | format-resume-stream(SSE), :id, :id/text | authMiddleware + aiLimiter |
| `/api/applications` | CRUD, mine, job/:jobId, :id/round | authMiddleware(role) |
| `/api/company` | dashboard, profile, photos | authMiddleware("company") |
| `/api/upload` | avatar, resume, logo, photos | authMiddleware + multer |

## 不要做什么 (What NOT to Do)

- 不要使用 `console.log`，使用 `logger.info/warn/error`
- 不要在 SSE 端点中遗漏 `X-Accel-Buffering: no` header
- 不要在控制器中直接修改 Application 状态，`addRoundResult` 是唯一入口
- 不要使用旧的非流式端点（respond/conclude），优先使用流式版本
- 不要硬编码 DeepSeek API URL/超时，从 `utils/deepseek.js` 环境变量读取

## 数据模型

| 模型 | 关键字段 |
|------|---------|
| User | email/password/role(student|company)/githubId |
| Student | fullName/avatarUrl/skills/education/resumeId |
| Company | companyName/companyLogoUrl/industry/companySize |
| Interview | chatHistory[]/feedbacks[]/result/rounds/difficulty |
| JobOpening | companyId/title/skills/rounds[]/status |
| Application | jobId/candidateId/status/history[]/approvedThrough |
| Resume | studentId/fileUrl/fileName/fileType/text |

## 中间件

| 中间件 | 用途 |
|--------|------|
| authMiddleware | JWT 验证，支持角色限制 `authMiddleware("student")` |
| errorHandler | 统一错误（ValidationError/CastError/DuplicateKey/JWT） |
| rateLimiter | apiLimiter(100/15min) + aiLimiter(20/15min) |
| validators/* | express-validator 输入校验 |

**相关文件**: 入口(`src/index.js`) | 控制器(`src/controllers/*.js`) | 路由(`src/routes/*.js`) | 模型(`src/models/*.js`) | 中间件(`src/middlewares/*.js`) | 服务层(`src/services/applicationService.js`) | 提示词(`src/prompts/*.js`) | 工具(`src/utils/*.js`)

## 变更记录 (Changelog)

| 日期 | 描述 |
|------|------|
| 2026-04-24 ~ 04-25 | 初始化并 5 次增量更新至 96.2% 覆盖率 |
| 2026-05-24 20:55:26 | 重构：新增 Winston 日志、QQ SMTP 邮件、X-Accel-Buffering、approvedThrough 追踪、简历流式格式化，覆盖率 98.6% |
