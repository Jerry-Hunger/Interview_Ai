# Frontend Guidelines

## 范围与目录

`client/` 是 React 19、Vite、TypeScript 与 Tailwind CSS 前端。页面按角色位于 `src/pages/auth/`、`src/pages/student/` 与 `src/pages/company/`；跨页面组件位于 `src/components/`，其中 `src/components/ui/` 为 shadcn/ui 基础组件。接口封装放在 `src/services/`，共享类型位于 `src/types/`，上下文、Hook、常量与通用函数分别放在 `src/contexts/`、`src/hooks/`、`src/constants/` 和 `src/utils/`。

## 开发与检查

在本目录执行 `npm install` 安装依赖，`npm run dev` 启动 Vite 开发服务器，`npm run lint` 执行 ESLint，`npm run build` 运行 TypeScript 构建并生成 `dist/`。提交前至少运行 lint 和 build。界面变更还应在窄屏与宽屏下验证，检查加载、空数据、错误和深色模式状态。

## 实现约定

使用 TypeScript 和 ESM；跟随现有文件的 2 空格缩进、单引号与无分号格式。组件、页面和 Context 使用 PascalCase，例如 `CompanyJobForm.tsx` 与 `ThemeContext.tsx`；Hook 以 `use` 开头，例如 `useFetch.ts`；工具、服务及常量文件使用 camelCase。组件 Props 应显式声明类型，避免使用 `any`；可复用领域类型放入 `src/types/`。

页面只负责组合布局与交互。请求必须经 `src/services/api.ts` 或现有 Axios 实例发起，不要在组件中硬编码 API 地址、令牌或重复拦截器逻辑。复用 `src/components/ui/`、`cn` 工具和既有设计 token；修改基础 UI 组件前先确认是否会影响全局。复杂状态应覆盖加载、成功、空态和失败反馈，异步请求必须处理取消或组件卸载后的状态更新风险。

## 测试、PR 与配置

目前未配置自动化前端测试。新增测试时与实现文件相邻，命名为 `*.test.tsx`，并优先验证用户可见行为。PR 附上 lint/build 结果；视觉变更提供前后截图。前端当前固定请求同源 `/api`，无需 `.env` 配置 API 地址；若将来新增 `VITE_` 变量，其值会打包进浏览器，绝不可放置密钥。
