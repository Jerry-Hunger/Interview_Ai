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

### 1. Backend Configuration (`server/.env`)

Create a `.env` file in the `server/` directory:

```env
# Server port
PORT=5000

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intellihire

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
| `PORT` | Server port (default: `5000`) | ✅ |
| `MONGO_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI generation | ✅ |
| `ALIYUN_OSS_*` | Aliyun OSS configuration for file storage | ❌ |

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

### Prerequisites

- **Node.js** v18+ (recommended v20+)
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)

### Step 1: Clone the Project

```bash
git clone <repository-url>
cd Interview_Ai
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 3: Configure Backend Environment

Create `server/.env` based on the template above. Make sure to fill in:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A strong random secret key
- `DEEPSEEK_API_KEY` - Your DeepSeek API key

### Step 4: Install Frontend Dependencies

```bash
cd ../client
npm install
```

### Step 5: Frontend API Proxy

No frontend environment variables are required. Vite already proxies the relative `/api` path to the local backend during development.

### Step 6: Start the Backend Server

```bash
cd server
npm run dev
```

The backend server will start at `http://localhost:5000`.

### Step 7: Start the Frontend Development Server

```bash
cd client
npm run dev
```

The frontend application will start at `http://localhost:5173`.

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
