[根目录(../CLAUDE.md) > **server**

# server/ — 服务端模块

> 模块路径: `D:\Development\Workspace\vscodepro\Interview_Ai\server`
> 生成时间: 2026-04-25 00:37:34

## 模块职责

后端 REST API 服务，处理认证、面试、职位、简历、申请、企业等功能。Express 5 + Mongoose 8，纯 JavaScript (ESM)。

## 入口与启动

- **入口文件**: `src/index.js`
- **端口**: `process.env.PORT || 5000`
- **数据库**: MongoDB via Mongoose
- **开发命令**: `npm run dev` (nodemon 热重载)

### index.js 核心设置

```js
// CORS 白名单 (FRONTEND_URL 逗号分隔)
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(",").map(s => s.trim()) || ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// 全局 API 限流 (apiLimiter)
app.use(express.json());
app.use(apiLimiter);

// 路由挂载
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/upload", uploadRoutes);

// 错误处理 + 优雅关闭 (SIGTERM/SIGINT)
```

## 对外接口 (API Routes)

### authRoutes (`/api/auth`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/register` | authController.register | 注册 (student/company) |
| POST | `/login` | authController.login | 登录 |
| GET | `/me` | authController.me | 获取当前用户 |
| PUT | `/profile` | authController.updateProfile | 更新资料 |
| GET | `/github` | authController.githubLogin | GitHub OAuth 入口 |
| GET | `/github/callback` | authController.githubCallback | GitHub OAuth 回调 |

**路由级别中间件**: 部分路由使用 `authMiddleware()` 鉴权 + `validate*` 验证 + `validate` 中间件。

### interviewRoutes (`/api/interview`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/start` | interviewController.startInterview | 开始面试（生成第一个问题） |
| POST | `/respond` | interviewController.respondToInterview | 普通回答 |
| POST | `/respond-stream` | interviewController.respondToInterviewStream | 流式回答 (SSE) |
| POST | `/conclude` | interviewController.concludeInterview | 结束面试（生成评估） |
| POST | `/conclude-stream` | interviewController.concludeInterviewStream | 流式结束 (SSE) |
| POST | `/summarize-role` | interviewController.summarizeRole | 总结角色 |
| POST | `/format-resume` | resumeController.formatResume | 格式化简历 |
| GET | `/mine` | interviewController.getUserInterviews | 获取我的面试记录 |
| GET | `/:id` | interviewController.getInterviewById | 获取某条面试详情 |

**路由级别中间件**: 所有路由使用 `authMiddleware()` 鉴权 + `aiLimiter` 限流 + `validate*` 验证 + `validate` 中间件。

### jobRoutes (`/api/jobs`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/` | jobController.createJob | 创建职位 |
| GET | `/` | jobController.listJobs | 获取职位列表（公开） |
| GET | `/company` | jobController.companyJobs | 企业自有职位 |
| GET | `/:jobId` | jobController.getJobDetail | 职位详情 |
| PUT | `/:jobId` | (路由中) | 更新职位 |
| DELETE | `/:jobId` | (路由中) | 删除职位 |

### resumeRoutes (`/api/resume`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/` | (interview route) | 格式化简历 |
| GET | `/:id` | resumeController.getResumeById | 获取简历元数据 |
| GET | `/:id/text` | resumeController.getResumeTextById | 获取简历文本（支持解析 PDF/DOCX） |
| GET | `/:id/file` | resumeController.getResumeFile | 获取简历文件（OSS 签名 URL） |
| PUT | `/:id/text` | resumeController.saveResumeText | 保存简历文本 |
| GET | `/user/:userId` | resumeController.getResumeByUserId | 获取用户简历 |

### applicationRoutes (`/api/applications`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/` | jobController.applyJob | 投递申请 |
| GET | `/` | applicationController.getAllApplications | 获取全部申请（admin） |
| GET | `/mine` | applicationController.getMyApplications | 我的申请（学生） |
| GET | `/job/:jobId` | jobController.getApplications | 某职位的所有申请（企业） |
| GET | `/:applicationId` | applicationController.getApplicationById | 申请详情 |
| PATCH | `/:applicationId` | jobController.updateApplicationStatus | 更新状态（企业） |
| POST | `/:applicationId/round` | applicationController.addRoundResult | 添加轮次结果 |

### companyRoutes (`/api/company`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| GET | `/dashboard` | companyController.getCompanyDashboard | 企业仪表盘 |
| GET | `/profile` | companyController.getCompanyProfile | 企业资料 |
| PUT | `/profile` | companyController.updateCompanyProfile | 更新资料 |
| DELETE | `/photos` | companyController.deleteCompanyPhoto | 删除照片 |

### uploadRoutes (`/api/upload`)

| 方法 | 路径 | 控制器 | 描述 |
|------|------|--------|------|
| POST | `/avatar` | uploadController.uploadAvatar | 上传头像 |
| POST | `/resume` | uploadController.uploadResume | 上传简历 |
| POST | `/logo` | uploadController.uploadLogo | 上传企业 Logo |
| POST | `/photos` | uploadController.uploadPhotos | 上传企业照片（最多10张） |

## 控制器详解

### authController.js — 认证控制器

**核心函数**:

#### register(req, res)
注册新用户（学生/企业）。
```js
// 逻辑：
// 1. 验证 role (student|company)
// 2. 检查邮箱唯一性
// 3. bcrypt.hash(password, 10)
// 4. 创建 User + 对应 Profile (Student/Company)
// 5. 生成 JWT (expiresIn: "1d")
// 返回: { message, user: {...profile, email}, token }
```

#### login(req, res)
用户登录。
```js
// 逻辑：
// 1. 查找 User
// 2. bcrypt.compare(password, user.password)
// 3. 查找对应 Profile
// 4. 生成 JWT (expiresIn: "1d")
// 返回: { token, role, user: {...profile, email} }
```

#### me(req, res)
获取当前用户信息。
```js
// 逻辑：req.user.id → User.findById → Profile.findById
// 返回: { user, role }
```

#### updateProfile(req, res)
更新当前用户资料。
```js
// 逻辑：根据 user.role 动态选择允许字段
// Student: fullName/avatarUrl/phone/location/education/skills/expectedSalaryMin/expectedSalaryMax/resumeId
// Company: companyName/companyLogoUrl/companyPhotos/companyDescription/companyWebsite/companySize/industry/roleOffered/companyLocation/companyLocationCoords
```

#### githubLogin(req, res)
重定向到 GitHub OAuth 授权页面。

#### githubCallback(req, res)
GitHub OAuth 回调处理。
```js
// 逻辑：
// 1. 用 code 换取 access_token
// 2. 用 access_token 获取 GitHub 用户信息
// 3. 查找/创建 User (通过 githubId 或 email)
// 4. 若新用户无 email，调用 /user/emails 获取主邮箱
// 5. 若 email 已存在则关联 githubId，否则创建新用户 + Student profile
// 6. 生成 JWT (expiresIn: "30d")
// 7. 重定向到 FRONTEND_URL/login?token=...&role=...
```

### jobController.js — 职位控制器

**核心函数**:

#### createJob(req, res)
创建新职位。
```js
// 请求体: { title, description, skills, rounds, status }
// 逻辑：验证必填 → 查找 Company → 创建 JobOpening → 保存
```

#### listJobs(req, res)
获取职位列表（支持筛选）。
```js
// 查询参数: company, rounds, type, status
// 筛选逻辑：
//   - rounds: 支持 "4+" 表示 >= 4
//   - type: 支持逗号分隔多值，匹配 rounds[].type
//   - company: 按公司名模糊搜索
// 返回: jobs (populate companyId 的 name/logo/location)
```

#### getJobDetail(req, res)
获取职位详情（含企业完整信息）。
```js
// 返回: job (扁平化 company 字段到顶层)
```

#### companyJobs(req, res)
获取当前企业自有职位列表。

#### applyJob(req, res)
学生投递职位申请。
```js
// 调用 applicationService.createApplicationForStudent
```

#### getApplications(req, res)
获取某职位的所有申请（需企业权限）。

#### updateApplicationStatus(req, res)
企业更新申请状态。

### companyController.js — 企业控制器

**核心函数**:

#### getCompanyDashboard(req, res)
企业仪表盘数据。
```js
// 返回: { stats, jobs, recentApplications }
// stats: { totalJobs, totalApplications, applied, inProgress, selected, finalSelected, rejected }
// recentApplications: 最近 5 条申请记录
```

#### getCompanyProfile(req, res)
获取企业资料。

#### updateCompanyProfile(req, res)
更新企业资料（动态字段过滤）。

#### deleteCompanyPhoto(req, res)
删除企业照片（从 companyPhotos 数组中移除）。

### resumeController.js — 简历控制器

**核心函数**:

#### formatResume(req, res)
AI 格式化简历文本。
```js
// 调用 deepseek + resumeFormatPrompt → 返回 { formatted }
```

#### formatResumeStream(req, res)
AI 格式化简历（SSE 流式）。

#### getResumeById(req, res)
获取简历元数据。

#### getResumeTextById(req, res)
获取简历文本（优先返回 text 字段，若无则从 OSS 下载并解析 PDF/DOCX）。
```js
// 解析逻辑：
//   - PDF: pdfjs-dist 逐页提取文本，若无文字则转图片 OCR
//   - DOCX: mammoth.extractRawText
// 解析后自动保存 text 到数据库
```

#### getResumeFile(req, res)
获取简历文件（重定向到 OSS 签名 URL）。

#### getResumeByUserId(req, res)
通过学生 ID 获取其简历。

#### saveResumeText(req, res)
手动保存简历文本。

### uploadController.js — 上传控制器

**核心函数**:

#### uploadAvatar(req, res)
上传用户头像（学生/企业通用）。
```js
// 限制: 2MB, jpg/png/webp
// 路径: avatars/{userId}.{ext}
// 更新: Student/Company.avatarUrl
```

#### uploadResume(req, res)
上传学生简历（仅学生）。
```js
// 限制: 5MB, pdf/doc/docx
// 路径: resumes/{userId}.{ext}
// 逻辑：删除旧简历 → 创建新 Resume → 更新 Student.resumeId
```

#### uploadLogo(req, res)
上传企业 Logo（仅企业）。
```js
// 限制: 2MB, jpg/png/webp
// 路径: logos/{userId}.{ext}
// 更新: Company.companyLogoUrl
```

#### uploadPhotos(req, res)
上传企业照片（仅企业，最多 10 张）。
```js
// 限制: 5MB/张, jpg/png/webp
// 路径: photos/{userId}/{index}.{ext}
// 逻辑: 合并到 existingPhotos (最多保留10张)
```

### interviewController.js — 面试控制器（完整 SSE 流式）

**面试核心控制器**，包含 SSE 流式传输的完整实现。

#### formatBlock(block)
将问答数组格式化为可读字符串。

#### startInterview(req, res)
开始第一轮面试，生成开场白和第一个问题。

#### respondToInterview(req, res)
普通（非流式）回答处理。

#### respondToInterviewStream(req, res) — **SSE 核心**
流式回答接口，逐步推送 AI 回复。

#### concludeInterview(req, res)
结束面试并生成评估（非流式）。

#### concludeInterviewStream(req, res) — **SSE 评估核心**
流式结束面试，边评估边推送结果。

#### getUserInterviews(req, res)
获取当前学生的所有面试记录。

#### getInterviewById(req, res)
获取单条面试详情。

#### summarizeRole(req, res)
生成职位总结。

### applicationController.js — 申请控制器

#### createApplication(req, res)
学生投递职位申请。

#### getAllApplications(req, res)
获取全部申请（需 admin 权限）。

#### getMyApplications(req, res)
学生获取自己的所有申请。

#### getJobApplications(req, res)
企业获取某职位的所有申请。

#### getApplicationById(req, res)
获取申请详情。

#### updateApplicationStatus(req, res)
企业更新申请状态。

#### addRoundResult(req, res)
添加轮次面试结果（核心状态流转）。
```js
// result: "success" | "failure"
// 流转: success + rn >= totalRounds → "selected"
//       success + rn < totalRounds → "in-progress"
//       failure → "rejected"
```

## 关键依赖与配置

| 包 | 版本 | 用途 |
|-----|------|------|
| express | 5.1.0 | Web框架 |
| mongoose | 8.18.0 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | JWT认证 |
| bcryptjs | 3.0.2 | 密码哈希 |
| deepseek-api | — | 通过 axios 调用 DeepSeek API |
| ali-oss | 6.23.0 | 阿里云OSS文件存储 |
| multer | 2.0.2 | 文件上传 |
| express-validator | 7.3.2 | 输入验证 |
| express-rate-limit | 8.3.2 | API限流 |
| cors | 2.8.5 | 跨域资源共享 |
| dotenv | 17.2.2 | 环境变量 |
| mammoth | 1.12.0 | DOCX解析 |
| pdfjs-dist | 4.10.38 | PDF解析 |

## 数据模型

### User (`src/models/User.js`)

```js
{
  email: String (unique, lowercase),
  password: String (required),
  role: "student" | "company" (required),
  githubId: String (unique, sparse)
}
```

### Student (`src/models/Student.js`)

```js
{
  email: String,
  fullName: String,
  avatarUrl: String,
  phone: String,
  location: String,
  education: String,
  skills: [String],
  expectedSalaryMin: String,
  expectedSalaryMax: String,
  resumeId: ObjectId (ref: Resume)
}
```

### Company (`src/models/Company.js`)

```js
{
  companyName: String (required),
  email: String (required, unique),
  companyLogoUrl: String,
  companyPhotos: [String],
  companyDescription: String,
  companyWebsite: String,
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "500+",
  industry: String,
  roleOffered: [String],
  companyLocation: String,
  companyLocationCoords: { lat: Number, lng: Number }
}
```

### Interview (`src/models/Interview.js`)

```js
{
  chatHistory: [{ type: Object }],
  finalFeedback: String,
  result: "success" | "failure" | "quit",
  type: "practice" | "company",
  difficulty: "beginner" | "intermediate" | "senior",
  resumeText: String,
  roleSummary: String,
  roundType: "behavioral" | "technical" | "system-design" | "coding" | "mixed",
  customTopic: String,
  rounds: Number (default: 1),
  currentRound: Number (default: 1),
  feedbacks: [String],
  student: ObjectId (ref: Student, required)
}
```

### JobOpening (`src/models/JobOpening.js`)

```js
{
  companyId: ObjectId (ref: Company),
  title: String,
  description: String,
  skills: [String],
  rounds: [{
    roundNumber: Number,
    type: "technical" | "behavioral" | "hr",
    difficulty: "easy" | "medium" | "hard",
    topic: String,
    duration: Number,
    notes: String
  }],
  status: "open" | "closed"
}
```

### Application (`src/models/Application.js`)

```js
{
  jobId: ObjectId (ref: JobOpening),
  candidateId: ObjectId (ref: Student),
  resumeId: ObjectId (ref: Resume),
  currentRound: Number (default: 0),
  status: "applied" | "in-progress" | "selected" | "final-selected" | "rejected",
  history: [{
    roundNumber: Number,
    interviewId: ObjectId (ref: Interview),
    result: "success" | "failure",
    feedback: String
  }]
}
```

### Resume (`src/models/Resume.js`)

```js
{
  studentId: ObjectId (ref: Student),
  fileUrl: String,
  fileName: String,
  fileType: String,
  text: String
}
```

## 验证器 (Validators)

所有验证器位于 `src/middlewares/validators/`，使用 `express-validator`。

### validate.js (验证中间件)

```js
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(422).json({ success: false, errors: errors.array() });
};
```

### authValidators.js

```js
validateRegister: [
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["student", "company"])
]
validateLogin: [
  body("email").isEmail(),
  body("password").notEmpty()
]
```

### interviewValidators.js

```js
validateStartInterview: [body("role").notEmpty(), body("resume").notEmpty()]
validateRespondInterview: [body("chatHistory").isArray(), body("answer").notEmpty()]
validateConcludeInterview: [body("history").isArray(), body("typeOfInterview").notEmpty(), body("difficulty").notEmpty()]
validateSummarizeRole: [body("prompt").notEmpty()]
validateFormatResume: [body("resumeText").notEmpty()]
```

### jobValidators.js

```js
validateCreateJob: [
  body("title").notEmpty(),
  body("description").notEmpty(),
  body("rounds").isArray({ min: 1 }),
  body("rounds.*.type").notEmpty(),
  body("rounds.*.difficulty").notEmpty()
]
validateApplyJob: [param("jobId").isMongoId()]
```

### resumeValidators.js

```js
validateFormatResume: [body("resumeText").notEmpty()]
validateResumeId: [param("id").isMongoId()]
validateUserId: [param("userId").isMongoId()]
```

### companyValidators.js

```js
validateUpdateProfile: [
  body("companyName").optional().notEmpty(),
  body("industry").optional().notEmpty(),
  body("companySize").optional().notEmpty()
]
```

### applicationValidators.js

```js
validateCreateApplication: [body("jobId").isMongoId()]
validateUpdateStatus: [
  param("applicationId").isMongoId(),
  body("status").isIn(["applied", "in-progress", "selected", "final-selected", "rejected"])
]
validateAddRoundResult: [
  param("applicationId").isMongoId(),
  body("result").isIn(["success", "failure"]),
  body("roundNumber").isInt({ min: 0 })
]
```

## 服务层 (applicationService.js)

### createApplicationForStudent

```js
export const createApplicationForStudent = async (candidateId, jobId) => {
  // 1. 查找学生，不存在则抛出 404 错误
  // 2. 检查是否已申请（jobId + candidateId 唯一）
  // 3. 创建 Application 记录，初始状态 "applied"
};
```

## AI 服务 (DeepSeek)

### 调用封装 (`src/utils/deepseek.js`)

```js
// baseURL: https://api.deepseek.com
// model: deepseek-chat
// 超时: DEEPSEEK_TIMEOUT (默认 60000ms)
// 重试机制: 指数退避 (最多 MAX_RETRIES=2 次)
// 4xx 错误不重试直接抛出，5xx/网络错误触发指数退避重试

// 普通调用
generateDeepSeekResponse(prompt) → string

// 流式调用 (AsyncGenerator)
streamDeepSeekResponse(prompt) → AsyncGenerator<string>
```

**重试机制详解**:
```js
const withRetry = async (fn, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status >= 400 && err.response?.status < 500) throw err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
};
```

### AI 角色定义 (`src/prompts/system.js`)

```js
export const AIISA_NAME = "艾莎";
export const INTERVIEWER = { name: AIISA_NAME, role: "一名经验丰富的面试官。不要提及你是 AI" };
```

### 面试提示词 (`src/prompts/interview.js`)

| 函数 | 用途 |
|------|------|
| `startInterviewFirstRound()` | 面试开场，生成第一个问题 |
| `startInterviewContinuationRound()` | 多轮面试续轮 |
| `respondNormal()` | 普通回答（追问） |
| `respondLastQuestion()` | 最后一题回答 |
| `concludeChunk()` | 分块评估（每5对QA） |
| `concludeFinal()` | 汇总生成最终反馈和结论 |
| `resumeFormatPrompt()` | 简历格式化提示词 |

### prompts/index.js

```js
export * from "./system.js";
export * from "./interview.js";
```

**评估流程**:
1. 问答按 5 对为一组分块 (CHUNK_SIZE=5)
2. 每块调用 `concludeChunk` 生成反馈
3. 最后调用 `concludeFinal` 汇总，输出"结果：通过/不通过"

## 中间件

### 认证 (`src/middlewares/authMiddleware.js`)

验证 JWT Bearer Token，设置 `req.user.id` 和 `req.user.role`。

### 错误处理 (`src/middlewares/errorHandler.js`)

统一错误响应格式。

### 异步处理 (`src/middlewares/asyncHandler.js`)

包装异步控制器，避免 try-catch 重复。

### 分页 (`src/middlewares/pagination.js`)

为查询添加分页参数。

### 限流 (`src/middlewares/rateLimiter.js`)

- `apiLimiter` — 全局 API 限流
- `aiLimiter` — AI 相关接口更严格限流

## 工具函数

### src/utils/deepseek.js — DeepSeek API 封装

```js
// axios 实例配置
const deepseekClient = axios.create({
  baseURL: "https://api.deepseek.com",
  timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || "60000", 10),
  headers: { "Content-Type": "application/json" },
});

// 指数退避重试包装器
const withRetry = async (fn, retries = 2) => {
  // 4xx 错误立即抛出，5xx/网络错误等待 2^attempt 秒后重试
};

// 普通调用
export const generateDeepSeekResponse = async (prompt) => {
  const response = await withRetry(() =>
    deepseekClient.post("/chat/completions", {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  );
  return response.data.choices[0].message.content;
};

// 流式调用
export const streamDeepSeekResponse = async function* (prompt) {
  // 返回 AsyncGenerator，持续 yield delta.content 直到 [DONE]
};
```

### src/utils/oss.js — 阿里云 OSS 工具

```js
// 获取 OSS 客户端单例
export const getOSSClient = () => {
  if (!client) {
    client = new OSS({
      region: process.env.ALIYUN_OSS_REGION,
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALIYUN_OSS_BUCKET,
    });
  }
  return client;
};

// 上传文件
export const uploadFile = async (file, path) => {
  const result = await client.put(path, file.buffer);
  return result.url;
};

// 路径生成
export const generateAvatarPath = (userId, ext) => `avatars/${userId}/${Date.now()}.${ext}`;
export const generateResumePath = (userId, ext) => `resumes/${userId}/${Date.now()}.${ext}`;
export const generateLogoPath = (userId, ext) => `logos/${userId}/${Date.now()}.${ext}`;
export const generatePhotoPath = (userId, ext, index) => `photos/${userId}/${Date.now()}_${index}.${ext}`;

// 文件类型验证
export const isValidImageType = (ext) => ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
export const isValidResumeType = (ext) => ['pdf', 'doc', 'docx'].includes(ext);

// 签名 URL (用于私有读 bucket)
export const getSignedUrl = (objectKey, expiresInSeconds = 3600) => {
  return client.signatureUrl(objectKey, { expires: expiresInSeconds });
};
```

### src/utils/apiResponse.js — 统一响应格式

```js
export const success = (res, data, status = 200) => {
  res.status(status).json({ success: true, ...data });
};

export const error = (res, message, status = 500) => {
  res.status(status).json({ success: false, error: message });
};
```

## 测试与质量

- **当前状态**: 项目无测试
- **Lint**: 暂无 (服务端正准备引入)

## 常见问题 (FAQ)

**Q: SSE 流式传输如何工作？**
A: `respondToInterviewStream` 和 `concludeInterviewStream` 使用 `res.write()` 逐步推送数据，客户端通过 EventSource 或 fetch 读取流。

**Q: 多轮面试如何处理？**
A: 前一轮结束后，客户端传入 `isContinuation=true` + `previousFeedback` 触发 `startInterviewContinuationRound`，AI 基于反馈调整后续难度。

**Q: 面试quit时如何保存？**
A: 当 `clientResult === "Quit"` 时，直接创建 Interview 条目，`result: "quit"`，跳过评估流程。

**Q: 申请状态如何流转？**
A: `addRoundResult` 是核心：success → in-progress/selected，failure → rejected。

**Q: chunk 评估的边界如何处理？**
A: 使用 `hasSummary` 检测最后一个 question 是否为 summary，若是则移除避免重复评估。

**Q: GitHub OAuth 如何处理无邮箱用户？**
A: 若 GitHub 用户无公开邮箱，调用 `/user/emails` API 获取 primary email；若 email 已存在则关联 githubId，否则创建新用户 + Student profile。

**Q: 简历文本提取失败时如何处理？**
A: PDF 若无法提取文字，自动转图片 OCR（tesseract.js）；DOCX 使用 mammoth 提取；若都失败则提示用户换格式。

**Q: DeepSeek API 重试机制如何工作？**
A: 使用指数退避，4xx 错误立即抛出，5xx/网络错误等待 1s/2s/4s 后重试，最多 2 次（可配置 DEEPSEEK_MAX_RETRIES）。

**Q: OSS 签名 URL 用于什么场景？**
A: 当 bucket 为私有读时，通过 `getSignedUrl` 生成有时限的访问 URL，用于让学生/企业直接下载简历文件。

## 相关文件清单

| 类别 | 路径 |
|------|------|
| 入口 | `src/index.js` |
| 数据库配置 | `src/config/db.js` |
| 控制器 | `src/controllers/*.js` |
| 路由 | `src/routes/*.js` |
| 模型 | `src/models/*.js` |
| 中间件 | `src/middlewares/*.js` |
| 验证器 | `src/middlewares/validators/*.js` |
| 服务层 | `src/services/*.js` |
| 提示词 | `src/prompts/*.js` |
| 工具 | `src/utils/*.js` |

## 变更记录 (Changelog)

| 日期 | 描述 |
|------|------|
| 2026-04-24 23:57:40 | 初始化 server 模块文档 |
| 2026-04-25 00:11:47 | 增量更新：补扫全部验证器/applicationService/applicationRoutes，覆盖率提升至 75% |
| 2026-04-25 00:23:36 | 增量更新：深度补扫 interviewController (SSE流式核心/分块评估)、applicationController (申请CRUD/状态流转)，覆盖率提升至 82% |
| 2026-04-25 00:27:55 | 增量更新：深度补扫 authController (GitHub OAuth)、jobController (职位CRUD)、companyController、resumeController (PDF/DOCX解析)、uploadController (OSS上传)，覆盖率提升至 91% |
| 2026-04-25 00:37:34 | 增量更新：补扫 server/utils (deepseek指数退避重试/oss上传工具/apiResponse统一响应)、server/routes (authRoutes/interviewRoutes)，覆盖率提升至 96.2% |
