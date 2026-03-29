# 详细规格说明

## 1. 数据模型

### 1.1 User 模型（修改）

#### 企业用户新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| companyLogoUrl | String | 公司 Logo URL |
| companyPhotos | [String] | 公司环境照片数组 |
| companyDescription | String | 公司简介 |
| companyLocation | String | 办公地点 |
| companyLocationCoords | Object | 办公地点坐标 {lat, lng} |
| companyWebsite | String | 公司官网 |

#### 学生用户新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| phone | String | 手机号 |
| location | String | 所在地 |
| expectedSalary | String | 期望薪资 |

### 1.2 JobOpening 模型（修改）

| 字段 | 类型 | 说明 |
|------|------|------|
| companyLogoUrl | String | 公司 Logo（冗余） |
| companyName | String | 公司名称（冗余） |
| companyLocation | String | 公司位置（冗余） |

## 2. API 接口

### 2.1 文件上传

```
POST /api/upload/logo
- 说明：上传公司 Logo
- 参数：file (图片)
- 返回：{ success, url }

POST /api/upload/photos
- 说明：上传公司环境照片（支持多张）
- 参数：files (图片数组)
- 返回：{ success, urls: [] }
```

### 2.2 企业信息

```
GET /api/company/profile
- 说明：获取企业信息
- 权限：company

PUT /api/company/profile
- 说明：更新企业信息
- 权限：company
- 参数：{ companyName, companyDescription, companyLocation, companyLocationCoords, companyWebsite }
```

### 2.3 学生信息

```
PUT /api/auth/profile
- 说明：更新个人信息
- 权限：student
- 参数：{ fullName, phone, location, expectedSalary }
```

### 2.4 职位列表（筛选）

```
GET /api/jobs
- 参数（可选）：
  - company: 公司名称关键词
  - rounds: 面试轮次数 (1, 2, 3, 4+)
  - type: 面试类型 (technical, behavioral, hr)
  - status: 职位状态 (open, closed)
```

### 2.5 GitHub OAuth（预留）

```
GET /api/auth/github
- 说明：跳转到 GitHub 授权页面

GET /api/auth/github/callback
- 说明：GitHub 授权回调
- 参数：code
```

## 3. 前端页面

### 3.1 企业资料页面

路径：`/company/profile`

功能：
- 公司 Logo 显示/上传
- 公司环境照片轮播/上传
- 公司简介编辑
- 办公地点输入 + 地图选点
- 官网链接

### 3.2 学生资料页面

路径：`/student/profile`

功能扩展：
- 姓名编辑
- 手机号编辑
- 所在地编辑
- 期望薪资编辑
- 头像上传（已有）
- 简历上传（已有）

### 3.3 职位筛选页面

路径：`/student/jobs`

功能：
- 公司名称搜索
- 面试轮次下拉 (1轮, 2轮, 3轮, 4轮以上)
- 面试类型多选 (技术面, HR面, 行为面)
- 状态筛选 (招聘中, 已结束)

## 4. 文件限制

| 类型 | 格式 | 大小 |
|------|------|------|
| Logo | jpg, png, webp | ≤ 2MB |
| 环境照片 | jpg, png, webp | ≤ 5MB/张，最多10张 |

## 5. 环境变量

```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```