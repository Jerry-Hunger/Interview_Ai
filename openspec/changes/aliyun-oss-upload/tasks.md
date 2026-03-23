# 实施任务清单：阿里云 OSS 文件上传

## 1. 后端任务

### 1.1 环境配置

- [x] 1.1.1 安装 ali-oss 依赖
  ```bash
  cd server && npm install ali-oss
  ```

- [x] 1.1.2 更新 server/.env，添加 OSS 配置
  ```
  ALIYUN_OSS_REGION=oss-cn-hangzhou
  ALIYUN_OSS_BUCKET=your-bucket-name
  ALIYUN_OSS_ACCESS_KEY_ID=your-key-id
  ALIYUN_OSS_ACCESS_KEY_SECRET=your-key-secret
  ```

- [x] 1.1.3 安装 multer 用于文件上传 (已存在)

- [x] 1.1.4 安装文件解析依赖（可选）(mammoth 已安装)

### 1.2 数据模型

- [x] 1.2.1 修改 User.js 模型，添加 avatarUrl 和 resumeId 字段
- [x] 1.2.2 新建 Resume.js 模型

### 1.3 工具封装

- [x] 1.3.1 创建 server/src/utils/oss.js，封装 OSS 上传方法

### 1.4 控制器

- [x] 1.4.1 创建 server/src/controllers/uploadController.js
  - [x] 上传头像逻辑
  - [x] 上传简历逻辑
- [x] 1.4.2 修改 server/src/controllers/resumeController.js
  - [x] 获取简历详情
  - [x] 获取用户简历

### 1.5 路由

- [x] 1.5.1 创建 server/src/routes/uploadRoutes.js
- [x] 1.5.2 修改 server/src/routes/resumeRoutes.js，添加简历 CRUD
- [x] 1.5.3 修改 server/src/routes/authRoutes.js，添加头像更新接口
- [x] 1.5.4 修改 server/src/index.js，注册新路由

---

## 2. 前端任务

### 2.1 组件开发

- [x] 2.1.1 创建 client/src/components/ui/AvatarUploader.tsx
  - [x] 文件选择
  - [x] 预览
  - [x] 上传调用

- [x] 2.1.2 重构 client/src/components/practice/ResumeUploader.tsx
  - [x] 改为文件上传
  - [x] 支持 PDF/DOC/DOCX

### 2.2 页面集成

- [x] 2.2.1 修改 client/src/pages/student/StudentProfile.tsx
  - [x] 添加头像显示区域
  - [x] 集成 AvatarUploader
  - [x] 更新简历上传逻辑

### 2.3 API 调用

- [x] 2.3.1 在 axiosInstance 或 api 文件中添加上传方法

---

## 3. 测试任务

- [ ] 3.1 测试头像上传功能
- [ ] 3.2 测试简历上传功能
- [ ] 3.3 测试文件类型限制
- [ ] 3.4 测试文件大小限制
- [ ] 3.5 测试前端页面显示

---

## 4. 清理任务

- [x] 4.1 从 server/.env 移除 Firebase 配置
- [x] 4.2 移除项目中未使用的 Firebase 相关代码
- [x] 4.3 从 package.json 移除 Firebase 依赖
- [x] 4.4 更新 README.md 和 AGENTS.md