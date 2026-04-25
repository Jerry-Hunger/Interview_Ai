[根目录(../CLAUDE.md) > **client**

# client/ — 前端模块

> 模块路径: `D:\Development\Workspace\vscodepro\Interview_Ai\client`
> 生成时间: 2026-04-25 00:37:34

## 模块职责

前端单页应用 (SPA)，负责用户界面、路由、API 调用。采用 React 19 + TypeScript，路径别名 `@` 指向 `src/`。

## 入口与启动

- **入口文件**: `src/main.tsx` — 渲染根组件 `<App />`
- **根组件**: `src/App.tsx` — 路由配置、QueryClient、ThemeProvider、ToastProvider
- **开发服务器**: `npm run dev` (Vite，默认端口 5173)
- **构建**: `npm run build` (tsc -b && vite build)
- **Lint**: `npm run lint`

## 路由结构

### 路由概览 (React Router 7)

| 路径 | 组件 | 角色 |
|------|------|------|
| `/` | Index | 公共首页 |
| `/login` | Login | 登录页 |
| `/register` | Register | 注册页 |
| `/student/dashboard` | StudentDashboard | 学生仪表盘 |
| `/student/practice` | StudentPractice | 模拟面试入口 |
| `/student/practice-result` | PracticeResultPage | 面试结果页 |
| `/student/jobs` | StudentsJobsPage | 职位列表页 |
| `/student/jobs/:id` | JobDetailPage | 职位详情页 |
| `/student/profile` | StudentProfile | 学生资料页 |
| `/student/applications` | StudentApplicationsPage | 我的申请页 |
| `/student/application/:id` | StudentApplicationDetailPage | 申请详情页 |
| `/company/dashboard` | CompanyDashboard | 企业仪表盘 |
| `/company/jobs` | CompanyJobsPage | 企业职位列表 |
| `/company/job/new` | CompanyJobForm | 新建/编辑职位 |
| `/company/job/:id` | CompanyJobApplicationsPage | 职位申请列表 |
| `/company/job/:jobId/:applicationId` | ApplicationDetailPage | 申请详情 |
| `/company/profile` | CompanyProfilePage | 企业资料页 |
| `*` | NotFound | 404 页 |

### App.tsx 核心逻辑

```tsx
// React.lazy 动态导入（代码分割）
const Index = React.lazy(() => import("./pages/Index"));
// ...

// QueryClient 配置（React Query v5）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// 路由外层: Navigation + Suspense(fallback=LoadingFallback)
```

## 对外接口 (API 层)

### API Hooks (`src/hooks/api.ts`)

基于 `@tanstack/react-query` + `axiosInstance`：

#### Interview
- `useMyInterviews()` — 获取我的面试记录列表

#### Jobs
- `useJobs(filters)` — 获取职位列表（支持筛选）
- `useJobDetail(id)` — 获取职位详情

#### Applications
- `useMyApplications()` — 获取我的申请列表
- `useApplicationDetail(id)` — 获取申请详情
- `useJobApplications(jobId)` — 获取某职位的所有申请
- `useApplyJob()` — 投递职位（mutation）

#### Company
- `useCompanyDashboard()` — 企业仪表盘数据
- `useCompanyJobs()` — 企业自有职位列表
- `useCompanyProfile()` — 企业资料
- `useCreateJob()` — 创建职位（mutation）
- `useUpdateApplicationStatus()` — 更新申请状态（mutation）
- `useUpdateCompanyProfile()` — 更新企业资料（mutation）
- `useUploadPhotos()` — 上传企业照片（mutation）
- `useDeleteCompanyPhoto()` — 删除企业照片（mutation）

#### Student
- `useStudentProfile()` — 获取学生资料
- `useResumeText(resumeId)` — 获取简历文本
- `useResumeDetail(resumeId)` — 获取简历详情

### axiosInstance (`src/utils/axiosInstance.ts`)

```ts
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
// Authorization header 由调用方在 api.ts 中手动注入
```

## 关键依赖与配置

| 包 | 版本 | 用途 |
|-----|------|------|
| react | 19.1.1 | UI框架 |
| react-router-dom | 7.8.2 | 路由 |
| @tanstack/react-query | 5.85.9 | 服务端状态管理 |
| axios | 1.11.0 | HTTP客户端 |
| @radix-ui/* | (多个) | 无头UI组件 |
| tailwindcss | 4.1.12 | CSS框架 |
| lucide-react | 0.542.0 | 图标 |
| react-markdown | 10.1.0 | Markdown渲染 |
| remark-gfm | 5.0.0 | GitHub Flavored Markdown |
| mammoth | 1.10.0 | DOCX解析 |
| pdfjs-dist | 5.4.149 | PDF解析 |
| tesseract.js | 7.0.0 | OCR文字识别 |

### vite.config.ts 关键配置
- `@tailwindcss/vite` 插件启用 Tailwind CSS v4
- 路径别名 `@` → `./src`

### tsconfig.json
- `strict: true` (严格模式)
- `verbatimModuleSyntax: true`
- 路径别名配置同 vite

## 主题系统

### ThemeContext (`src/contexts/ThemeContext.tsx`)

```tsx
type Theme = 'dark' | 'light' | 'system';
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// 实现逻辑：
// 1. 从 localStorage 读取已保存的主题
// 2. useEffect 移除 root 的 light/dark class
// 3. system 模式监听 window.matchMedia 选择暗/亮
// 4. 其他模式直接添加 theme class
```

**使用方式**:
```tsx
import { useTheme } from "@/contexts/ThemeContext";

const MyComponent = () => {
  const { theme, setTheme } = useTheme();
  // theme: 'dark' | 'light' | 'system'
  // setTheme(newTheme) 保存到 localStorage
};
```

暗色主题通过 `.dark` class 切换。

## 核心业务组件详解

### PracticeSetup (`components/practice/PracticeSetup.tsx`)

面试配置表单组件，负责收集用户面试设置参数。

**Props**:
```ts
type PracticeSetupProps = {
  setupData: SetupData;
  setSetupData: React.Dispatch<React.SetStateAction<SetupData>>;
  handleSetupSubmit: () => void;
  navigate: (path: string) => void;
  isStarting: boolean;
};
```

**表单字段**:
| 字段 | 组件 | 选项 |
|------|------|------|
| 简历 | `<ResumeUploader>` | 上传 PDF/DOCX，自动解析文本 |
| 目标职位 | `<Input>` | 文本输入 |
| 难度等级 | `<Select>` | beginner(0-2年) / intermediate(2-5年) / senior(5年+) |
| 面试类型 | `<Select>` | behavioral / technical / system-design / coding / mixed |
| 面试轮次 | `<Select>` | 1-4 轮 |
| 每轮问题数 | `<Select>` | 5-8 个问题 |
| 重点领域 | `<Textarea>` | 可选，自定义重点话题 |

**加载态**: 提交时显示全屏遮罩，提示"准备面试中"。

### PracticeInterview (`components/practice/PracticeInterview.tsx`)

面试进行时的核心界面组件，包含 AI 面试官窗口、摄像头预览、麦克风控制、实时聊天等。

**Props**:
```ts
type PracticeInterviewProps = {
  setupData: SetupData;
  interviewState: InterviewState;
  setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>;
  handleAnswerSubmit: () => void;
  handleEndInterview: () => void;
  handleQuit: () => void;
  toast: ToastFunc;
  isLoading?: boolean;
  interviewPhase?: "answering" | "ended";
  streamingMessage?: string;
  currentRound?: number;
};
```

**布局 (三栏)**:
| 区域 | 宽度 | 内容 |
|------|------|------|
| 左侧边栏 | col-span-3 | 职位类型、面试类型、进度条、当前问题 |
| 中央主区域 | col-span-6 | AI面试官头像(摄像头) + 面试者头像(可选) + 回答输入框 |
| 右侧边栏 | col-span-4 | `<ChatWindow>` 问答历史 |

**功能特性**:
1. **AI 语音播报**: 使用 `window.speechSynthesis` 朗读问题，支持选择女声
2. **语音识别**: 使用 Web Speech API (`SpeechRecognition`) 实时转写麦克风输入
3. **摄像头预览**: 使用 `navigator.mediaDevices.getUserMedia` 获取视频流
4. **进度指示**: 问题进度条（已完成绿色/当前蓝色/未完成灰色）
5. **流式消息**: 支持 `streamingMessage` 实时显示 AI 回复

**设备控制**:
```ts
// 麦克风切换
toggleMic() // 启动/停止语音识别，自动提交转写文本

// 摄像头切换
setInterviewState(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }))
```

**面试结束处理**:
- `interviewPhase === "ended"` 时隐藏输入框，显示"查看面试反馈"按钮
- 进度条显示全部完成状态

### ChatWindow (`components/practice/ChatWindow.tsx`)

问答历史侧边栏组件，显示完整的对话记录。

**Props**:
```ts
type ChatWindowProps = {
  chatHistory: ChatMessage[];
  streamingMessage?: string;
  rounds?: number;
  currentRound?: number;
};

type ChatMessage = {
  type: "question" | "answer";
  content: string;
  timestamp: string;
};
```

**功能特性**:
- 自动滚动到最新消息（`scrollIntoView`）
- 使用 ReactMarkdown + remarkGfm 渲染 Markdown 内容
- 问题显示 `MessageCircle` 图标（indigo 色调）
- 回答显示 `User` 图标（purple 色调）
- 流式消息在无历史时直接显示
- 多轮面试时显示 "X轮/Y轮" 指示器

**样式**:
- 问题气泡: `bg-gradient-to-r from-indigo-50 to-indigo-100` (暗色: `from-[#23263A] to-[#1C1E2C]`)
- 回答气泡: `bg-gradient-to-r from-purple-50 to-purple-100` (暗色: `from-[#23263A] to-[#1C1E2C]`)
- 高度: `h-[calc(100vh-16rem)]`，可滚动

### ResumeUploader (`components/practice/ResumeUploader.tsx`)

简历上传与解析组件，支持拖拽/点击上传 PDF、DOCX 文件，并自动解析文字内容。

**Props**:
```ts
type ResumeUploaderProps = {
  handleDataChanged: (data: { resumeText: string; resumeId?: string; fileUrl?: string; fileName?: string }) => void;
  onUploadSuccess?: (data: { resumeId: string; fileUrl: string; fileName: string }) => void;
  initialResumeText?: string;
};
```

**解析流程**:

1. **文件上传**: 先 POST `/upload/resume`，获取 resumeId 和 fileUrl
2. **文字提取**:
   - **PDF**: 使用 pdfjs-dist 逐页提取文字；若全页无文字则转图片 OCR（tesseract.js）
   - **DOCX**: 使用 mammoth.extractRawText
3. **进度反馈**: 实时显示解析状态、进度条、预估剩余时间
4. **取消功能**: 支持取消正在进行的解析操作

**核心函数**:
| 函数 | 用途 |
|------|------|
| `getPdfjs()` | 动态导入 pdfjs-dist + worker |
| `pdfPageToImage()` | 将 PDF 每页渲染为 PNG 图片 |
| `extractTextByOCR()` | 使用 tesseract.js 识别图片文字 |
| `extractTextFromPDF()` | PDF 主解析流程（文字优先，失败则 OCR） |
| `extractTextFromDocx()` | DOCX 解析流程 |

**状态**:
- `loading`: 是否正在处理
- `status`: 当前阶段提示
- `progress`: 0-100 进度
- `estimatedTime`: 预估剩余秒数
- `fileName`: 已上传文件名

**限制**:
- 支持格式: `.pdf`, `.doc`, `.docx`
- 文件大小: 最多 5MB

### PracticeResults (`components/practice/PracticeResults.tsx`)

面试结果展示组件，显示评估反馈、结果判定、并提供多轮续接功能。

**Props**:
```ts
type PracticeResultsProps = {
  interview: Interview;
  navigate: (path: string, options?: { state?: unknown }) => void;
  setupData?: SetupData;
  rounds?: number;
  previousInterviewIds?: string[];
};
```

**数据类型**:
```ts
type Interview = {
  _id: string;
  type: "practice" | "company";
  role: string;
  difficulty: string;
  roundType: string;
  result: "success" | "failure" | "Quit";
  feedback: string;
  transcript: { role: string; content: string }[];
  createdAt: string;
  finalFeedback?: string;
  chatHistory?: { type: string; content: string; timestamp: string }[];
  feedbacks?: string[];  // 分块评估反馈
  roleSummary?: string;
  rounds?: number;
  currentRound?: number;
};
```

**UI 布局**:
1. **分项反馈** (Accordion): 每块评估反馈可展开查看
2. **最终反馈**: ReactMarkdown 渲染的完整评估
3. **结果判定**: 通过/未通过 + 难度标签
4. **下一步操作**:
   - 继续下一轮（仅当 success 且未达最后一轮）
   - 再练一次
   - 浏览职位
   - 返回仪表盘
5. **面试记录**: 滚动显示完整对话历史

**多轮面试状态延续**:
- 使用 `location.state` 传递 `currentRound`/`totalRounds`/`roundInterviewIds`/`isCompletedSession`
- 本轮 `interview.finalFeedback` 作为下一轮 `previousFeedback`
- localStorage 保存 `pendingNextRound`（interviewId + nextRound）

**判断逻辑**:
```ts
canContinue() {
  // 条件：当前轮 < 总轮数 && 本轮成功 && 无待处理续轮 && 之前所有轮都成功
}
```

### Navigation (`components/Navigation.tsx`)

顶部导航栏组件，根据用户登录状态和角色动态渲染菜单。

**核心逻辑**:

```tsx
const Navigation = () => {
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("role"));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  // 监听路由变化，同步 localStorage 到组件状态
  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setToken(localStorage.getItem("token"));
  }, [location.pathname]);

  // 动态菜单项
  let navItems = publicNavItems;  // 未登录
  if (token && role === "student") navItems = studentNavItems;
  if (token && role === "company") navItems = companyNavItems;
};
```

**菜单配置**:

| 角色 | 菜单项 |
|------|--------|
| 公开 | 首页、登录、注册 |
| 学生 | 仪表盘、模拟面试、浏览职位、我的申请、个人资料 |
| 企业 | 仪表盘、发布职位、职位列表、公司资料 |

**功能特性**:
1. **Logo 点击跳转**: 根据登录状态跳转不同仪表盘（学生/企业）或首页
2. **主题切换**: 明/暗模式切换按钮（Moon/Sun 图标）
3. **退出登录**: 确认弹窗 + localStorage 清理 + 跳转登录页
4. **移动端响应式**: 汉堡菜单 + 下拉导航
5. **活跃状态高亮**: 当前路由对应的菜单项显示背景高亮

### CompanyProfilePage (`pages/company/CompanyProfile.tsx`)

企业资料管理页面，支持编辑企业信息、上传 Logo/照片、管理招聘职位。

**数据类型**:

```ts
type CompanyUser = {
  companyName?: string;
  companyLogoUrl?: string;
  companyPhotos?: string[];
  companyDescription?: string;
  companyLocation?: string;
  companyLocationCoords?: { lat: number; lng: number };
  companyWebsite?: string;
  email?: string;
  industry?: string;
  companySize?: string;
  roleOffered?: string[];
};
```

**核心功能**:

1. **资料编辑模式**
   - 点击"编辑"进入编辑模式
   - 显示"确认"和"取消"按钮
   - 仅保存有变化的字段（脏检查）

2. **Logo 上传**
   - 使用 `SimpleAvatarUploader` 组件
   - 上传至 `/upload/logo`
   - 实时预览

3. **公司环境照片**
   - 最多 10 张，每张 5MB
   - 支持多张同时上传
   - hover 显示预览/删除按钮
   - 点击大图预览（modal）

4. **行业/规模选择**
   - 下拉选择器
   - 选项来自 `@/constants/industries`

5. **招聘职位标签**
   - 可添加/删除职位标签
   - 编辑模式下输入框 + 添加按钮

6. **已发布职位列表**
   - 显示职位标题、技能标签、状态
   - 点击跳转到职位详情页

**API Hooks 使用**:

```ts
const { data: profileData, isPending } = useCompanyProfile();
const { data: publishedJobs = [] } = useCompanyJobs();
const updateProfile = useUpdateCompanyProfile();
const uploadPhotos = useUploadPhotos();
const deletePhoto = useDeleteCompanyPhoto();
```

## 简历解析工具 (`src/utils/resumeExtractor.ts`)

### 支持格式
- **PDF**: 使用 `pdfjs-dist` 逐页提取文本
- **DOCX**: 使用 `mammoth` 提取原始文本
- **不支持**: 抛出 `Unsupported file format. Please upload PDF or DOCX.`

### API
```ts
extractResumeText(file: File): Promise<string>
// 根据 MIME 类型分发到对应解析器

pickResumeFile(): Promise<{ file: File; text: string }>
// 创建隐藏的 file input，点击后返回文件和解析文本
```

### 依赖版本
- `pdfjs-dist`: 5.4.149
- `mammoth`: 1.10.0

## 数据模型 (前端状态)

### PracticeSetup 数据结构 (`Practice.tsx` / `PracticeSetup.tsx`)

```ts
type SetupData = {
  resume: string;           // 简历文本
  role: string;            // 目标职位
  difficulty: string;      // 难度: beginner|intermediate|senior
  roundType: string;       // 面试类型: behavioral|technical|system-design|coding|mixed
  topic: string;           // 重点领域（可选）
  rounds: number;          // 轮次: 1-4
  questionsPerRound: number; // 每轮问题数: 5-8
};
```

### InterviewState (`PracticeInterview.tsx`)

```ts
type InterviewState = {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  isRecording: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  answer: string;
  question: string;
  chatHistory: ChatMessage[];
};

type ChatMessage = {
  type: "question" | "answer";
  content: string;
  timestamp: string;
};
```

### Interview 返回数据结构

```ts
type Interview = {
  _id: string;
  type: "practice" | "company";
  role: string;
  difficulty: string;
  roundType: string;
  rounds: number;
  currentRound?: number;
  result: "success" | "failure" | "Quit";
  feedback: string;
  transcript: { role: string; content: string }[];
  createdAt: string;
  finalFeedback?: string;
  chatHistory?: { type: string; content: string; timestamp: string }[];
  feedbacks?: string[];
};
```

## 练习页面流程 (Practice.tsx)

### 三步骤状态机

```
setup → interview → results
```

### Step "setup"
- 渲染 `<PracticeSetup>` 懒加载组件
- 填写职位/难度/类型/轮次等参数
- 上传简历后自动填充 resume 字段

### Step "interview"
- 渲染 `<PracticeInterview>` 懒加载组件
- 使用 SSE 流式调用 `/interview/respond-stream`
- 支持敷衍重问检测 (`isPerfunctoryReprompt`)
- 多轮面试支持：每轮结束保存 `pendingNextRound` 到 localStorage

### Step "results"
- 渲染 `<PracticeResults>` 懒加载组件
- 展示最终反馈和评估结果

### 多轮面试状态延续
```ts
// location.state 携带参数
{
  continueRound?: boolean;
  previousRoundIds?: string[];
  setupData?: SetupData;
  currentRound?: number;
  previousFeedback?: string;
}
```

## 常量 (`src/constants/industries.ts`)

```ts
export const INDUSTRIES = [
  "互联网", "金融", "教育", "医疗健康", "电子商务",
  "游戏", "企业服务", "硬件/物联网", "汽车交通",
  "房产家居", "餐饮旅游", "广告营销", "其他"
];

export const COMPANY_SIZES = [
  { value: "1-10", label: "1-10人" },
  { value: "11-50", label: "11-50人" },
  // ...
];
```

## 组件结构

### 核心业务组件 (`src/components/practice/`)

| 组件 | 路径 | 职责 |
|------|------|------|
| PracticeSetup | `components/practice/PracticeSetup.tsx` | 面试参数配置表单 |
| PracticeInterview | `components/practice/PracticeInterview.tsx` | 面试进行界面（AI窗口+摄像头+麦克风+聊天） |
| PracticeResults | `components/practice/PracticeResults.tsx` | 面试结果展示（含多轮续接） |
| ResumeUploader | `components/practice/ResumeUploader.tsx` | 简历上传与解析（PDF OCR） |
| ChatWindow | `components/practice/ChatWindow.tsx` | 问答历史侧边栏 |

### UI 组件 (`src/components/ui/`)

shadcn/ui 组件库，40+ 组件（accordion, alert, alert-dialog, avatar, badge, button, card, carousel, checkbox, collapsible, context-menu, dialog, drawer, dropdown-menu, hover-card, input, input-otp, label, menubar, navigation-menu, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip）。

**注意**: 不要手动修改 `ui/` 目录下的组件，应通过 shadcn/cli 管理和更新。

### Navigation (`components/Navigation.tsx`)

导航栏组件，根据用户角色（学生/企业）动态渲染菜单。

### LoadingFallback (`components/LoadingFallback.tsx`)

全局 Suspense 加载态回退组件。

## 页面组件 (`src/pages/`)

| 目录 | 页面 | 职责 |
|------|------|------|
| `auth/` | Login, Register | 登录注册 |
| `student/` | Dashboard, Practice, PracticeResultPage, JobDetailPage, StudentsJobsPage, StudentApplicationsPage, StudentApplicationDetailPage, StudentProfile | 学生端所有页面 |
| `company/` | Dashboard, CompanyJobsPage, CompanyJobApplicationsPage, ApplicationDetailPage, CompanyJobForm, CompanyProfile | 企业端所有页面 |
| 根目录 | Index, NotFound | 首页、404 |

## 测试与质量

- **当前状态**: 项目无测试
- **ESLint**: `npm run lint` 使用 flat config + `typescript-eslint`

## 常见问题 (FAQ)

**Q: 为什么不使用 Redux？**
A: 项目已安装 Redux 但未使用。架构决定使用 React Query 管理服务端状态，Redux 仅作为占位符。

**Q: 暗色主题如何切换？**
A: 通过 `.dark` class 切换。`ThemeContext` 提供 `defaultTheme` 和 `storageKey`，支持 'dark' | 'light' | 'system' 三种模式。

**Q: 简历如何解析？**
A: 使用 mammoth (DOCX)、pdfjs-dist (PDF)、tesseract.js (图片OCR)，最终文本通过 `/api/interview/format-resume` 提交给 AI 格式化。

**Q: 多轮面试如何续接？**
A: 通过 localStorage 保存 `pendingNextRound`， Practice 页面读取 location.state 中的 `continueRound` 和 `previousFeedback` 触发续轮。

**Q: 语音识别和语音播报如何工作？**
A: 使用浏览器原生 Web Speech API，`SpeechSynthesis` 朗读 AI 问题，`SpeechRecognition` 实时转写用户语音输入。

**Q: ResumeUploader 如何处理 OCR 失败？**
A: 若 PDF 无文字则自动转图片 OCR；若 OCR 也失败，提示用户换格式或尝试 DOCX。

**Q: PracticeResults 如何判断能否继续下一轮？**
A: 检查 (currentRound < totalRounds) && (result === "success") && (无待处理续轮) && (之前所有轮都成功)。

**Q: Navigation 如何响应路由变化？**
A: 使用 `useEffect` 监听 `location.pathname`，同步 localStorage 中的 role 和 token 到组件状态，确保页面刷新后菜单正确更新。

**Q: CompanyProfile 如何实现增量保存？**
A: 编辑模式下记录 `cardValues` 变更，仅在保存时对比 `originalCompany` 和当前 `company` 的差异，仅提交有变化的字段。

## 相关文件清单

| 类别 | 路径 |
|------|------|
| 入口 | `src/main.tsx`, `src/App.tsx` |
| 路由页 | `src/pages/**/*.tsx` |
| 业务组件 | `src/components/practice/*.tsx`, `src/components/Navigation.tsx` |
| UI组件 | `src/components/ui/*.tsx` |
| API hooks | `src/hooks/api.ts` |
| HTTP客户端 | `src/utils/axiosInstance.ts` |
| 主题 | `src/contexts/ThemeContext.tsx` |
| 简历工具 | `src/utils/resumeExtractor.ts` |
| 常量 | `src/constants/industries.ts` |

## 变更记录 (Changelog)

| 日期 | 描述 |
|------|------|
| 2026-04-24 23:57:40 | 初始化 client 模块文档 |
| 2026-04-25 00:11:47 | 增量更新：补扫 ThemeContext/resumeExtractor/Practice.tsx/industries.ts，覆盖率提升至 75% |
| 2026-04-25 00:23:36 | 增量更新：深度补扫 PracticeSetup (配置表单完整字段)、PracticeInterview (语音识别/摄像头/SSE流式/AI语音播报)，覆盖率提升至 82% |
| 2026-04-25 00:27:55 | 增量更新：深度补扫 ChatWindow (Markdown渲染/流式消息/多轮指示)、ResumeUploader (PDF OCR解析/进度反馈/取消)、PracticeResults (多轮续接/Accordion分项反馈/判定逻辑)，覆盖率提升至 91% |
| 2026-04-25 00:37:34 | 增量更新：深度补扫 Navigation (动态菜单/退出确认/移动端响应)、CompanyProfilePage (编辑模式/Logo上传/照片管理/职位标签/已发布职位列表)，覆盖率提升至 96.2% |
