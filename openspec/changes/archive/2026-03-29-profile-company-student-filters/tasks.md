# 实施任务清单

## 第一阶段：企业端上传功能

### 1.1 修改 User 模型
- [x] 1.1.1 添加企业用户字段 (companyLogoUrl, companyPhotos, companyDescription, companyLocation, companyLocationCoords, companyWebsite)
- [x] 1.1.2 添加学生用户字段 (phone, location, expectedSalary)

### 1.2 修改 JobOpening 模型
- [x] 1.2.1 添加冗余字段 (companyLogoUrl, companyName, companyLocation)

### 1.3 上传接口
- [x] 1.3.1 修改 uploadRoutes 添加 /logo 端点
- [x] 1.3.2 修改 uploadRoutes 添加 /photos 端点

---

## 第二阶段：企业管理页面

### 2.1 后端 API
- [x] 2.1.1 创建 companyController.js
  - [x] getCompanyProfile
  - [x] updateCompanyProfile
- [x] 2.1.2 修改 companyRoutes.js
- [x] 2.1.3 同步更新职位冗余字段逻辑

### 2.2 前端
- [x] 2.2.1 创建 LogoUploader.tsx 组件 (复用 AvatarUploader)
- [x] 2.2.2 创建 PhotosUploader.tsx 组件 (内嵌在 CompanyProfile)
- [x] 2.2.3 创建 company/CompanyProfile.tsx 页面
- [x] 2.2.4 添加路由配置

---

## 第三阶段：学生端扩展

### 3.1 后端 API
- [x] 3.1.1 修改 authController.js
  - [x] 修改 me 接口返回完整信息
  - [x] 添加 updateProfile 方法
- [x] 3.1.2 修改 authRoutes.js

### 3.2 前端
- [x] 3.2.1 修改 StudentProfile.tsx
  - [x] 添加姓名编辑
  - [x] 添加手机号编辑
  - [x] 添加所在地编辑
  - [x] 添加期望薪资编辑

---

## 第四阶段：职位筛选功能

### 4.1 后端 API
- [x] 4.1.1 修改 jobController.js 的 listJobs 方法
  - [x] 添加 company 筛选
  - [x] 添加 rounds 筛选
  - [x] 添加 type 筛选

### 4.2 前端
- [x] 4.2.1 修改 StudentsJobsPage.tsx
  - [x] 添加公司搜索框
  - [x] 添加面试轮次筛选
  - [x] 添加面试类型筛选
  - [x] 添加状态筛选

---

## 第五阶段：GitHub OAuth 准备

### 5.1 环境变量
- [x] 5.1.1 添加 GitHub OAuth 配置到 .env

### 5.2 后端 API
- [x] 5.2.1 修改 authRoutes.js 添加 /github 路由
- [x] 5.2.2 添加 githubCallback 处理

### 5.3 前端
- [x] 5.3.1 修改 Login.tsx 添加 GitHub 登录按钮