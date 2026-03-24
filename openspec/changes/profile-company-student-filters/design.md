# 技术方案

## 1. 技术选型

| 功能 | 技术 |
|------|------|
| 文件上传 | 复用现有 OSS 上传逻辑 |
| 图片存储 | 阿里云 OSS (复用) |
| 前端状态 | React hooks |
| 表单验证 | React Hook Form |

## 2. 后端架构

### 2.1 目录结构变更

```
server/src/
├── controllers/
│   ├── companyController.js   (新增)
│   ├── authController.js       (修改)
│   └── jobController.js       (修改)
├── routes/
│   ├── companyRoutes.js       (修改)
│   └── authRoutes.js          (修改)
└── index.js                   (修改)
```

### 2.2 OSS 路径规则

| 类型 | 路径格式 |
|------|----------|
| Logo | logos/{companyId}/{timestamp}.{ext} |
| 照片 | photos/{companyId}/{timestamp}_{index}.{ext} |

## 3. 前端架构

### 3.1 组件结构

```
client/src/
├── components/
│   └── ui/
│       ├── LogoUploader.tsx    (新建 - 复用 AvatarUploader)
│       └── PhotosUploader.tsx  (新建 - 多图上传)
├── pages/
│   ├── company/
│   │   └── CompanyProfile.tsx  (新建)
│   └── student/
│       └── StudentProfile.tsx  (修改 - 扩展字段)
```

## 4. 数据冗余设计

为减少查询，在 JobOpening 中冗余存储：
- companyLogoUrl
- companyName  
- companyLocation

更新企业信息时，需同步更新所有关联职位。

## 5. GitHub OAuth 流程

```
1. 前端点击 GitHub 登录按钮
2. 跳转 GitHub 授权页面
3. 用户授权后回调 /api/auth/github/callback?code=xxx
4. 后端用 code 换取 access_token
5. 用 access_token 获取用户信息
6. 查找/创建用户，返回 JWT
```

## 6. 筛选逻辑

### 后端筛选

```javascript
const filter = {};
if (company) filter.companyName = new RegExp(company, 'i');
if (rounds) filter['rounds.length'] = rounds === '4+' ? { $gte 4 } : parseInt(rounds);
if (type) filter['rounds.type'] = type;
if (status) filter.status = status;
```

### 前端筛选

使用 URL query params 保持筛选状态，支持分享链接。