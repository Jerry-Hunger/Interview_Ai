[根目录](../CLAUDE.md) > **client**

# client/ -- 前端模块

> React 19 + TypeScript strict SPA，路径别名 `@` 指向 `src/`。

## 模块职责

前端单页应用，负责用户界面、路由、API 调用。学生端：面试练习/职位浏览/申请管理。企业端：发布职位/管理候选人。

## 架构变化 (2026-05)

- **类型集中化**: 所有共享类型迁移至 `types/index.ts`
- **API 重构**: 从 `hooks/api.ts` (React Query) 迁移到 `services/api.ts` (纯函数) + `hooks/useFetch.ts` (通用 hook)
- **统一 Markdown**: `components/shared/MarkdownRenderer.tsx`（3 变体：default/chat/compact）
- **面试工具**: `utils/interview.ts` -- `isPerfunctoryReprompt()` / `stripRepromptTag()`
- **统一常量**: `constants/status.ts`, `constants/difficulty.ts`, `constants/roundType.ts`

## 入口与启动

- **入口**: `src/main.tsx` -> `src/App.tsx`（路由 + QueryClient + ThemeProvider + ToastProvider）
- **开发**: `npm run dev` (Vite, 5173) | **构建**: `npm run build` | **Lint**: `npm run lint`

## 关键模式

### API 调用 (services/api.ts + hooks/useFetch.ts)

```ts
export const fetchJobs = async (filters: Record<string, string>): Promise<Job[]> => { ... }
export function useFetch<T>(fetchFn: () => Promise<T>, deps?, options?: { enabled? }): UseFetchResult<T>
// 页面: const { data, loading, error } = useFetch(() => fetchJobs(filters), [filters]);
```

### 类型 / Markdown / 常量

```ts
import type { Job, Application, Interview, SetupData } from "@/types";  // 统一类型
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";     // variant: default|chat|compact
import { statusColors, statusLabels } from "@/constants/status";         // 状态颜色/标签
```

## 路由结构

| 路径 | 组件 | 角色 |
|------|------|------|
| `/`, `/login`, `/register` | Index, Login, Register | 公共/认证 |
| `/student/dashboard` | StudentDashboard | 学生 |
| `/student/practice`, `/student/practice-result` | StudentPractice, PracticeResultPage | 学生(面试) |
| `/student/jobs`, `/student/jobs/:id` | StudentsJobsPage, JobDetailPage | 学生(职位) |
| `/student/applications`, `/student/application/:id` | StudentApplicationsPage, StudentApplicationDetailPage | 学生(申请) |
| `/student/profile` | StudentProfile | 学生(资料) |
| `/company/dashboard` | CompanyDashboard | 企业 |
| `/company/jobs`, `/company/job/new`, `/company/job/:id` | CompanyJobsPage, CompanyJobForm, CompanyJobApplicationsPage | 企业(职位) |
| `/company/job/:jobId/:applicationId` | ApplicationDetailPage | 企业(申请详情) |
| `/company/profile` | CompanyProfilePage | 企业(资料) |

## 核心组件

| 组件 | 职责 |
|------|------|
| PracticeSetup (`practice/`) | 面试参数配置（简历/职位/难度/类型/轮次） |
| PracticeInterview (`practice/`) | 面试界面（AI窗口+语音识别+摄像头+流式SSE） |
| PracticeResults (`practice/`) | 结果展示+多轮续接 |
| ChatWindow (`practice/`) | 问答历史侧边栏 |
| ResumeUploader (`practice/`) | 简历上传解析（PDF OCR/DOCX） |
| ResumeViewer (`resume/`) | 简历流式格式化预览（SSE） |
| MarkdownRenderer (`shared/`) | 统一 Markdown 渲染（3 变体） |
| SimpleAvatarUploader (`ui/`) | 头像/Logo 上传组件 |

## 不要做什么 (What NOT to Do)

- 不要手动修改 `components/ui/` 下的 shadcn/ui 组件，通过 shadcn/cli 管理
- 不要在组件中内联 `ReactMarkdown` 配置，使用统一的 `MarkdownRenderer`
- 不要硬编码状态颜色/标签，从 `constants/status.ts` 导入
- 不要使用 `hooks/api.ts`（旧 React Query 方式），新代码用 `services/api.ts` + `useFetch`
- 不要重复定义类型，从 `types/index.ts` 导入

## 依赖要点

- React Query 已安装但未使用（占位符），状态管理使用 useFetch hook
- Web Speech API: `SpeechSynthesis` 朗读，`SpeechRecognition` 转写
- PDF: `pdfjs-dist` 5.4 | DOCX: `mammoth` | OCR: `tesseract.js`

## 相关文件清单

入口(`src/main.tsx`, `src/App.tsx`) | 类型(`src/types/index.ts`) | API(`src/services/api.ts`) | Hook(`src/hooks/useFetch.ts`) | HTTP(`src/utils/axiosInstance.ts`) | 面试工具(`src/utils/interview.ts`) | 常量(`src/constants/*`) | 主题(`src/contexts/ThemeContext.tsx`) | 页面(`src/pages/**/*.tsx`) | 业务组件(`src/components/practice/*.tsx`, `shared/*.tsx`)

## 变更记录 (Changelog)

| 日期 | 描述 |
|------|------|
| 2026-04-24 ~ 04-25 | 初始化并 5 次增量更新至 96.2% 覆盖率 |
| 2026-05-24 20:55:26 | 重构文档：API 层迁移、类型集中化、新增 MarkdownRenderer/ResumeViewer/SimpleAvatarUploader/常量文件，覆盖率 98.6% |
