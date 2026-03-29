# 技术方案：阿里云 OSS 文件上传

## 1. 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| OSS SDK | ali-oss | 官方 Node.js SDK，稳定可靠 |
| 文件上传方式 | 后端中转 | 简单安全，不暴露凭证 |
| 解析库 | pdf-parse, mammoth | 解析 PDF 和 DOCX 文本 |

## 2. 后端架构

### 2.1 目录结构

```
server/src/
├── models/
│   ├── User.js       (修改)
│   └── Resume.js     (新建)
├── utils/
│   └── oss.js        (新建 - OSS 工具封装)
├── routes/
│   ├── uploadRoutes.js   (新建 - 上传路由)
│   ├── resumeRoutes.js   (修改 - 简历 CRUD)
│   └── authRoutes.js     (修改 - 头像更新)
├── controllers/
│   ├── uploadController.js   (新建)
│   └── resumeController.js  (修改)
└── index.js         (修改 - 注册新路由)
```

### 2.2 OSS 工具封装 (utils/oss.js)

```javascript
import OSS from 'ali-oss';

let client = null;

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

export const uploadFile = async (file, path) => {
  const client = getOSSClient();
  const result = await client.put(path, file.buffer);
  return result.url;
};
```

## 3. 工作流程

### 3.1 头像上传流程

```
前端 → POST /api/upload/avatar → 后端 → OSS → 返回 URL → 更新 User.avatarUrl
```

### 3.2 简历上传流程

```
前端 → POST /api/upload/resume → 后端 → OSS → 解析文本 → 保存 Resume → 返回 URL
```

## 4. 文件命名规则

| 类型 | 路径格式 | 示例 |
|------|----------|------|
| 头像 | avatars/{userId}/{timestamp}.{ext} | avatars/abc123/1706000000000.png |
| 简历 | resumes/{userId}/{timestamp}.{ext} | resumes/abc123/1706000000000.pdf |

## 5. 安全性考虑

1. **文件类型校验** - multer + 手动校验双重保障
2. **文件大小限制** - multer 限制 + 手动校验
3. **用户身份验证** - 所有上传接口需要登录认证
4. **路径隔离** - 用户只能上传到自己的目录

## 6. 前端集成

### 6.1 文件上传组件

使用原生 `<input type="file">` 配合 FormData 上传：

```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data.url;
};
```

### 6.2 Avatar 组件展示

使用 shadcn/ui 的 Avatar 组件：

```tsx
<Avatar className="h-24 w-24">
  <AvatarImage src={user.avatarUrl} />
  <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
</Avatar>
```