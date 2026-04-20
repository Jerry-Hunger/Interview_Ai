# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

IntelliHire — AI 驱动的面试练习与招聘平台。学生通过 AI 模拟面试练习（AI 角色"艾莎"），企业发布职位并管理候选人。前后端分离，独立管理依赖，无根级 package.json。

## 常用命令

```bash
# 客户端 (client/)
cd client && npm run dev      # Vite 开发服务器
cd client && npm run build    # tsc 编译检查 + vite 构建
cd client && npm run lint     # ESLint 检查

# 服务端 (server/)
cd server && npm run dev      # nodemon 热重载 (监听 PORT 5000)
```

项目当前没有测试。

## 技术栈

**客户端**: React 19 + TypeScript 5.8 (strict) + Vite 7 + Tailwind CSS 4 + shadcn/ui (Radix UI) + React Router 7 + React Query + axios + react-hook-form + zod。路径别名 `@` → `./src`。

**服务端**: Express 5 (ESM, `"type": "module"`) + Mongoose 8 + JWT + DeepSeek API (deepseek-chat) + 阿里云 OSS + multer。纯 JavaScript，无 TypeScript。

## 架构

### 通信方式

- 客户端 axios 实例 baseURL 来自 `VITE_API_URL`，JWT Bearer Token 存 localStorage
- 面试对话和评估反馈支持 SSE 流式传输

### API 路由前缀

`/api/auth` 认证 | `/api/interview` 面试 | `/api/jobs` 职位 | `/api/resume` 简历 | `/api/applications` 申请 | `/api/company` 企业 | `/api/upload` 上传

### 核心数据模型

- **User** — email/password/role(student|company)/githubId，与 Student/Company 共享 `_id`（嵌入式 profile 设计）
- **Student** — fullName/avatarUrl/skills/education/resumeId
- **Company** — companyName/companyLogoUrl/industry/companySize
- **Interview** — chatHistory[]/finalFeedback/result/type/difficulty/rounds/feedbacks[]
- **JobOpening** — companyId/title/description/skills/rounds[]/status
- **Application** — jobId/candidateId/resumeId/currentRound/status/history[]

### 面试核心流程

1. 学生上传简历 + 配置参数（职位/难度/类型/轮次）
2. DeepSeek AI 生成开场白和第一个问题
3. 学生回答 → AI 追问（支持普通/流式）
4. 问答按 5 个一组分块评估 → 汇总生成最终反馈和结论
5. Interview 记录存入 MongoDB

### 目录结构要点

- `client/src/components/ui/` — shadcn/ui 组件库，不要手动修改
- `client/src/components/practice/` — 面试练习核心组件
- `server/src/prompts/` — AI 提示词模板（system.js 角色设定，interview.js 各阶段提示词）
- `server/src/utils/deepseek.js` — DeepSeek API 调用封装（普通+流式）
- `openspec/` — 项目变更规格文档

## 环境变量

客户端 `client/.env`: `VITE_API_URL`

服务端 `server/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `DEEPSEEK_API_KEY`, 阿里云 OSS 配置 (`ALIYUN_OSS_*`), GitHub OAuth 配置 (`GITHUB_*`), `FRONTEND_URL`, 可选 `HTTP_PROXY`

## 编码约定

- 所有界面文案使用中文
- 客户端 TypeScript strict 模式，ESLint flat config
- 服务端纯 JS (ESM)，使用 `import/export` 语法
- Tailwind CSS v4 (CSS-first 配置，通过 @tailwindcss/vite 插件)
- 暗色主题通过 `.dark` class 切换
- React Query 管理服务端状态（Redux 已安装但未使用，不要新增 Redux 代码）
