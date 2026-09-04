/**
 * 前端统一类型定义
 * 所有共享类型集中在此文件，各组件直接 import 使用
 */

// ─── Application 申请相关 ───

export type ApplicationStatus = "applied" | "in-progress" | "selected" | "final-selected" | "rejected";

/** 申请列表中的精简类型（列表接口返回） */
export type Application = {
  _id: string;
  jobId: { _id: string; title: string };
  candidateId?: { _id: string; fullName: string; email?: string; skills?: string[] };
  status: ApplicationStatus;
  createdAt?: string;
  currentRound?: number;
};

/** 申请详情的完整类型（详情接口返回） */
export type ApplicationDetail = Omit<Application, "jobId" | "candidateId" | "currentRound"> & {
  jobId: {
    _id: string;
    title: string;
    description?: string;
    difficulty?: string;
    company?: { name?: string };
    rounds: JobRound[];
  };
  candidateId: { _id: string; fullName: string; email: string; skills?: string[] };
  resumeId?: { _id: string; fileUrl: string; fileName: string; fileType: string };
  currentRound: number;
  approvedThrough?: number;
  history: ApplicationHistoryEntry[];
};

export type ApplicationHistoryEntry = {
  roundNumber: number;
  interviewId?: string;
  result: "success" | "failure";
  feedback?: string;
};

// ─── Job 职位相关 ───

export type JobRound = {
  roundNumber?: number;
  type?: RoundType;
  difficulty?: string;
  topic?: string;
  duration?: number;
  notes?: string;
};

export type Job = {
  _id: string;
  title: string;
  description?: string;
  createdAt?: string;
  status?: "open" | "closed";
  difficulty?: string;
  skills?: string[];
  rounds?: JobRound[];
  companyName?: string;
  companyLogoUrl?: string;
  companyLocation?: string;
  companySize?: string;
  companyWebsite?: string;
  industry?: string;
  companyDescription?: string;
};

// ─── Interview 面试相关 ───

export type InterviewResult = "success" | "failure" | "quit";
export type InterviewType = "practice" | "company";
export type DifficultyLevel = "beginner" | "intermediate" | "senior";
export type RoundType = "behavioral" | "technical" | "hr";

export type ChatMessage = {
  type: "question" | "answer";
  content: string;
  timestamp: string;
};

export type Interview = {
  _id: string;
  type: InterviewType;
  role: string;
  difficulty: string;
  roundType: string;
  rounds?: number;
  currentRound?: number;
  result: InterviewResult;
  feedback: string;
  transcript: { role: string; content: string }[];
  createdAt: string;
  finalFeedback?: string;
  chatHistory?: ChatMessage[];
  feedbacks?: string[];
  roleSummary?: string;
  /** 简历文本，多轮面试续接时使用 */
  resumeText?: string;
  resumeId?: string;
  applicationId?: string;
};

export type ResumeSummary = {
  _id: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "doc" | "docx";
  isArchived: boolean;
  isDefault: boolean;
  updatedAt: string;
};

// ─── Practice/Interview 流程相关 ───

export type SetupData = {
  resume: string;
  resumeId?: string;
  role: string;
  difficulty: string;
  roundType: string;
  topic: string;
  rounds: number;
  questionsPerRound: number;
  currentRound?: number;
};

export type InterviewState = {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  isRecording: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  answer: string;
  question: string;
  chatHistory: ChatMessage[];
  isReprompt?: boolean;
};

export type InterviewPhase = "answering" | "ended";
export type PracticeStep = "setup" | "interview" | "results";

// ─── Company 企业相关 ───

export type CompanyDashboardData = {
  stats?: {
    applied?: number;
    inProgress?: number;
    selected?: number;
    finalSelected?: number;
    rejected?: number;
    totalJobs?: number;
    activeJobs?: number;
    totalApplications?: number;
  };
  jobs?: Job[];
  recentApplications?: Application[];
};
