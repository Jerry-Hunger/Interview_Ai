# 阿里云 OSS 文件上传功能规格

## 1. 数据模型

### 1.1 User 模型（修改）

在现有字段基础上新增：

| 字段 | 类型 | 说明 |
|------|------|------|
| avatarUrl | String | 头像图片 OSS URL |
| resumeId | ObjectId | 关联的简历记录 ID |

### 1.2 Resume 模型（新建）

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId (ref: User) | 用户 ID |
| fileUrl | String | 简历文件 OSS URL |
| fileName | String | 原始文件名 |
| fileType | String | 文件类型 (pdf, doc, docx) |
| textContent | String | 解析后的文本内容 |
| parsedAt | Date | 解析完成时间 |

## 2. API 接口

### 2.1 上传头像

```
POST /api/upload/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求参数:
- file: 图片文件 (jpg, png, webp, ≤2MB)

响应成功 (200):
{
  "success": true,
  "url": "https://xxx.oss.com/avatars/xxx.png"
}

响应失败 (400):
{
  "success": false,
  "error": "文件类型不支持"
}
```

### 2.2 上传简历

```
POST /api/upload/resume
Content-Type: multipart/form-data
Authorization: Bearer <token>

请求参数:
- file: 简历文件 (pdf, doc, docx, ≤5MB)

响应成功 (200):
{
  "success": true,
  "url": "https://xxx.oss.com/resumes/xxx.pdf",
  "resume": {
    "id": "xxx",
    "fileName": "resume.pdf",
    "fileType": "pdf"
  }
}
```

### 2.3 获取简历详情

```
GET /api/resume/:id
Authorization: Bearer <token>

响应成功 (200):
{
  "id": "xxx",
  "userId": "xxx",
  "fileUrl": "https://xxx.oss.com/resumes/xxx.pdf",
  "fileName": "resume.pdf",
  "fileType": "pdf",
  "textContent": "...",
  "parsedAt": "2024-01-01T00:00:00Z"
}
```

### 2.4 获取用户简历

```
GET /api/resume/user/:userId
Authorization: Bearer <token>

响应成功 (200):
{
  "id": "xxx",
  "fileUrl": "https://xxx.oss.com/resumes/xxx.pdf",
  "fileName": "resume.pdf",
  "fileType": "pdf"
}
```

## 3. 文件限制

### 3.1 头像图片

| 属性 | 值 |
|------|------|
| 允许格式 | jpg, jpeg, png, webp |
| 文件大小 | ≤ 2MB |
| 存储路径 | avatars/{userId}/{timestamp}.{ext} |

### 3.2 简历文件

| 属性 | 值 |
|------|------|
| 允许格式 | pdf, doc, docx |
| 文件大小 | ≤ 5MB |
| 存储路径 | resumes/{userId}/{timestamp}.{ext} |

## 4. 环境变量

### 4.1 后端 (.env)

```
# 阿里云 OSS 配置
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=intellihire-files
ALIYUN_OSS_ACCESS_KEY_ID=<your-access-key-id>
ALIYUN_OSS_ACCESS_KEY_SECRET=<your-access-key-secret>
```

## 5. 前端组件

### 5.1 AvatarUploader

- 支持图片预览
- 点击上传按钮触发文件选择
- 上传成功后显示头像预览

### 5.2 ResumeUploader (重构)

- 支持 PDF/DOC/DOCX 文件选择
- 显示文件名和文件大小
- 上传成功后显示文件信息

## 6. 错误处理

| 错误码 | 描述 |
|------|------|
| 400 | 文件类型不支持 |
| 400 | 文件大小超限 |
| 401 | 未登录 |
| 404 | 简历不存在 |
| 500 | 服务器错误 |