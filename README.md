# IntelliHire - AI-Powered Interview & Hiring Platform

IntelliHire is an **AI-powered interview and hiring platform** that helps:

- 🎓 **Students** practice interviews in real-time with AI-driven simulators.
- 🏢 **Companies** conduct automated hiring through AI-driven interviews and candidate evaluations.

The platform offers **customizable practice interviews**, **resume-based question generation**, **speech-to-text and text-to-speech support**, and a **round-wise automated hiring pipeline** — all in one place.

---

## 🚀 Features

- 🤖 **AI-Driven Interviews** powered by DeepSeek API.
- 🎤 **Real-Time Interviews** with **Web Speech API** (STT + TTS).
- 📊 **Detailed Results** – pass/fail status, feedback, transcript, and round analysis.
- ⚡ **Automated Hiring** – companies can define job rounds, AI evaluates candidates automatically.
- 🎯 **Customizable Practice Interviews** – choose topic, difficulty, or custom questions.
- 📑 **Resume Integration** – built-in **resume text extractor** (PDF, DOCX, OCR) for personalized interviews.
- 🌓 **Light/Dark Mode** support.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **TailwindCSS v4** with shadcn/ui components
- **TypeScript**
- **React Router v7**
- **Recharts** for data visualization

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **DeepSeek API** for AI-powered interview generation

### Integrations
- **Web Speech API** (STT & TTS)
- **PDF.js** for resume parsing
- **Tesseract.js** for OCR (scanned documents)
- **Mammoth.js** for DOCX parsing

---

## 📁 Project Structure

```
Interview_Ai/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── practice/   # Interview practice components
│   │   │   ├── resume/     # Resume-related components
│   │   │   └── ui/         # shadcn/ui base components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   │   ├── auth/       # Login & Register
│   │   │   ├── student/    # Student dashboard pages
│   │   │   └── company/    # Company dashboard pages
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                # Frontend environment variables
│   └── package.json
│
├── server/                 # Backend (Node.js)
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Express middlewares
│   │   ├── config/         # Configuration
│   │   ├── utils/          # Utility functions (DeepSeek API)
│   │   └── index.js        # Server entry point
│   ├── .env                # Backend environment variables
│   └── package.json
│
├── README.md
└── AGENTS.md              # Developer documentation
```

---

## 🔧 Environment Setup

### 1. Docker Compose Configuration (`.env`)

在项目根目录创建 `.env` 文件（与 `docker-compose.yml` 同级）：

```env
# MongoDB connection string（默认使用 Docker Compose 内置 MongoDB）
MONGO_URI=mongodb://mongodb:27017/intellihire

# JWT secret key (use a strong random string, 64+ characters recommended)
JWT_SECRET=your_jwt_secret_here

# DeepSeek API key
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here

# 阿里云 OSS configuration
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
```

#### Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `CLIENT_PORT` | 前端对宿主机暴露的端口，示例配置为 `8081` | ❌ |
| `SERVER_PORT` | 后端监听并对宿主机暴露的端口，默认 `5000` | ❌ |
| `MONGODB_PORT` | MongoDB 对宿主机暴露的调试端口，默认 `27017` | ❌ |
| `MONGO_URI` | MongoDB 连接字符串；默认指向 Docker Compose 内置 MongoDB | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI generation | ✅ |
| `DEEPSEEK_TIMEOUT` | DeepSeek 请求超时（毫秒），默认 `60000` | ❌ |
| `DEEPSEEK_MAX_RETRIES` | DeepSeek 请求失败后的重试次数，默认 `2` | ❌ |
| `ALIYUN_OSS_*` | Aliyun OSS configuration for file storage | ❌ |
| `FRONTEND_URL` | GitHub OAuth 完成后跳转的前端地址，默认模板为 `http://localhost:8080` | GitHub OAuth 时必填 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth 应用凭据 | GitHub OAuth 时必填 |
| `GITHUB_TIMEOUT` / `GITHUB_MAX_RETRIES` | GitHub API 请求超时（毫秒）与重试次数，默认分别为 `30000`、`3` | ❌ |
| `HTTP_PROXY` | GitHub API 使用的 HTTP/HTTPS 代理地址 | ❌ |
| `QQ_SMTP_HOST` / `QQ_SMTP_PORT` | QQ 邮箱 SMTP 主机与端口，默认 `smtp.qq.com:465` | 邮件通知时必填 |
| `QQ_SMTP_USER` / `QQ_SMTP_PASS` | QQ 邮箱 SMTP 用户名与授权码 | 邮件通知时必填 |
| `LOG_LEVEL` | Winston 日志最低级别，默认 `http` | ❌ |

### 2. Frontend API Configuration

The frontend always sends requests to the relative `/api` path; no `client/.env` API address is needed.

- During local development, Vite proxies `/api` to `http://localhost:5000`.
- In production, configure Nginx to reverse-proxy `/api` to the backend service.

For example, keep the `/api` prefix when forwarding so the backend routes remain unchanged. Disable proxy buffering for the streaming interview endpoints:

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:5000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_buffering off;
}
```

---

## 📦 Installation & Getting Started

### 前置条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（包含 Docker Compose v2）
- DeepSeek API Key 与用于签名的 JWT Secret

### Step 1: Clone the Project

```bash
git clone <repository-url>
cd Interview_Ai
```

### Step 2: Configure Backend Environment

根据根目录模板创建 `.env`。Docker Compose 读取该文件并注入后端容器；默认 MongoDB 地址已配置，只需至少填入：
- `JWT_SECRET` - A strong random secret key
- `DEEPSEEK_API_KEY` - Your DeepSeek API key

```bash
cp .env.example .env
```

如需继续使用 MongoDB Atlas，直接修改 `.env` 中的 `MONGO_URI`。

### Step 3: Start the Application

```bash
docker compose up --build -d
```

首次启动会构建前后端镜像并创建名为 `mongodb_data` 的数据卷。应用启动后访问 `http://localhost:<CLIENT_PORT>`（按示例配置为 [http://localhost:8081](http://localhost:8081)）；API 通过同源 `/api` 由 Nginx 反向代理到后端，同时可通过 `http://localhost:<SERVER_PORT>`（默认 `http://localhost:5000`）直接调试 API。MongoDB 也会映射到 `mongodb://localhost:<MONGODB_PORT>`（默认 `mongodb://localhost:27017`），便于使用数据库客户端调试。

查看运行状态与日志：

```bash
docker compose ps
docker compose logs -f
```

停止服务但保留数据库数据：

```bash
docker compose down
```

如需清空本地 MongoDB 数据并重新开始，请显式执行 `docker compose down -v`。

#### 使用 MongoDB Atlas（可选）

```bash
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intellihire
```

GitHub OAuth 回调按示例配置为 `http://localhost:8081`。如修改 `CLIENT_PORT`，也要同步修改 `.env` 中的 `FRONTEND_URL`；部署到其他域名时同样修改该项：

```bash
FRONTEND_URL=https://example.com
```

---

## 📖 Usage Guide

### For Students

1. **Register & Login** – Create an account as a student.
2. **Build Your Profile** – Upload your resume for personalized interview questions.
3. **Practice Interviews** – Choose interview type (technical, behavioral, coding, etc.), difficulty level, and target role.
4. **Review Results** – Get detailed feedback, transcripts, and improvement suggestions.
5. **Browse Jobs** – Explore open positions and apply directly.
6. **Track Applications** – Monitor your application status and upcoming interviews.

### For Companies

1. **Register & Login** – Create an account as a company.
2. **Post Job Openings** – Define job roles, required skills, and interview rounds.
3. **Review Applications** – View candidate profiles and resumes.
4. **Manage Candidates** – Approve/reject candidates, track interview progress.
5. **Automated Evaluation** – AI handles interview rounds and provides candidate feedback.

---

## 🎯 API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all open jobs |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create new job (company) |
| GET | `/api/jobs/company` | Get company's jobs |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Apply for a job |
| GET | `/api/applications/mine` | Get student's applications |
| GET | `/api/applications/job/:id` | Get job's applications |
| PATCH | `/api/applications/:id` | Update application status |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews/start` | Start practice interview |
| POST | `/api/interviews/respond` | Submit answer |
| POST | `/api/interviews/complete` | Complete interview |
| GET | `/api/interviews/:id` | Get interview details |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/format-resume` | AI-format resume text |

### Company Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/dashboard` | Dashboard statistics |

---

## 🧪 Available Scripts

### Frontend (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend (`server/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload (nodemon) |

---

## 📝 License

This project is licensed under the MIT License.
