# Backend Guidelines

## 范围与目录

`server/` 是基于 Express 5、MongoDB 与 Mongoose 的 ESM API 服务。入口为 `src/index.js`；端点定义在 `src/routes/`，HTTP 编排在 `src/controllers/`，可复用业务逻辑在 `src/services/`，持久化模型在 `src/models/`。认证、错误处理、限流和请求校验位于 `src/middlewares/`；第三方 API、日志及统一响应工具在 `src/utils/`；面试生成提示词位于 `src/prompts/`。

## 开发与运行

在本目录执行 `npm install`，再使用 `npm run dev` 通过 Nodemon 启动服务。服务依赖 `PORT`、`MONGO_URI`、`JWT_SECRET` 与 `DEEPSEEK_API_KEY`；OSS 配置按 README 需要提供。当前没有单独的 lint、build 或 test 脚本。改动完成后至少启动服务并手动验证相关端点的成功、校验失败与未授权响应。

## 分层与代码规范

使用 ESM JavaScript、2 空格缩进，并遵循临近文件的引号和分号风格。Mongoose 模型使用 PascalCase（如 `JobOpening.js`）；路由、控制器、服务和工具使用 camelCase（如 `applicationService.js`）。路由只负责路径、中间件与控制器绑定；控制器负责解析请求与发送响应；跨端点业务逻辑放入服务层；模型只处理数据模式与持久化。

新增或修改写入端点时，先添加或更新 `middlewares/validators/` 中的校验，并在权限检查后执行数据访问。使用 `src/utils/apiResponse.js` 保持响应格式一致，错误交由既有错误处理中间件；不要在控制器内泄露原始异常或堆栈。涉及流式响应时，确保断连后清理资源并保持 SSE 头部语义。

## 安全、测试与 PR

凭据只读取环境变量，禁止提交 `.env`、JWT、数据库 URI、DeepSeek 密钥、邮件密码或 OSS 访问密钥。修改 CORS、Cookie、限流、上传或鉴权时，验证学生与企业角色的授权边界，并检查文件类型、大小、超时和第三方调用失败路径。新增测试采用 `*.test.js`，放在对应模块附近或 `src/**/__tests__/`。PR 说明端点契约、状态码、数据迁移和手动验证结果；影响 API 的改动须同步更新 README。
