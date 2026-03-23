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

# Firebase configuration (optional)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

#### Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: `5000`) | ✅ |
| `MONGO_URI` | MongoDB Atlas connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI generation | ✅ |
| `FIREBASE_*` | Firebase configuration for file storage | ❌ |

### 2. Frontend Configuration (`client/.env`)

Create a `.env` file in the `client/` directory:

```env
# API base URL (no trailing slash)
VITE_API_URL=http://localhost:5000/api
```

For production deployment, update this to your deployed backend URL.

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

### Step 5: Configure Frontend Environment

Create `client/.env` based on the template above:

```env
VITE_API_URL=http://localhost:5000/api
```

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
