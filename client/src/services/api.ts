import axiosInstance from "@/utils/axiosInstance";
import type { Job, Application, CompanyDashboardData, ResumeSummary } from "@/types";

// 重导出类型，方便其他模块从 services/api 引入
export type { Job, Application, CompanyDashboardData } from "@/types";

// ─── 面试 ───

/** 获取我的面试记录列表 */
export const fetchMyInterviews = async () => {
  const res = await axiosInstance.get("/interview/mine");
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

// ─── 职位 ───

/** 获取职位列表（支持筛选） */
export const fetchJobs = async (filters: Record<string, string>): Promise<Job[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.append(k, v);
  });
  const res = await axiosInstance.get(`/jobs?${params.toString()}`);
  return (res.data?.jobs || []) as Job[];
};

/** 获取职位详情 */
export const fetchJobDetail = async (id: string) => {
  const res = await axiosInstance.get(`/jobs/${id}`);
  return res.data?.job;
};

// ─── 申请 ───

/** 获取我的申请列表 */
export const fetchMyApplications = async (): Promise<Application[]> => {
  const res = await axiosInstance.get("/applications/mine");
  return (res.data?.applications || []) as Application[];
};

/** 获取申请详情 */
export const fetchApplicationDetail = async (id: string) => {
  const res = await axiosInstance.get(`/applications/${id}`);
  return res.data?.application;
};

/** 获取某职位的所有申请 */
export const fetchJobApplications = async (jobId: string) => {
  const res = await axiosInstance.get(`/applications/job/${jobId}`);
  return res.data?.applications || [];
};

/** 投递职位 */
export const applyJob = async (jobId: string, resumeId: string) => {
  return axiosInstance.post("/applications", { jobId, resumeId });
};

/** 更新申请状态 */
export const updateApplicationStatus = async (params: { id: string; status: string; jobId?: string }) => {
  return axiosInstance.patch(`/applications/${params.id}`, { status: params.status });
};

// ─── 企业 ───

/** 获取企业仪表盘数据 */
export const fetchCompanyDashboard = async (): Promise<CompanyDashboardData> => {
  const res = await axiosInstance.get("/company/dashboard");
  return res.data as CompanyDashboardData;
};

/** 获取企业自有职位列表 */
export const fetchCompanyJobs = async (): Promise<Job[]> => {
  const res = await axiosInstance.get("/jobs/company");
  return (res.data?.jobs || []) as Job[];
};

/** 获取企业资料 */
export const fetchCompanyProfile = async () => {
  const res = await axiosInstance.get("/company/profile");
  return res.data;
};

/** 创建职位 */
export const createJob = async (data: { title: string; description: string; skills: string[]; rounds: unknown[] }) => {
  return axiosInstance.post("/jobs", data);
};

/** 更新企业资料 */
export const updateCompanyProfile = async (data: Record<string, unknown>) => {
  return axiosInstance.put("/company/profile", data);
};

/** 上传企业照片 */
export const uploadPhotos = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));
  const res = await axiosInstance.post("/upload/photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** 删除企业照片 */
export const deleteCompanyPhoto = async (url: string) => {
  return axiosInstance.delete("/company/photos", { data: { url } });
};

/** 更新职位状态 */
export const updateJobStatus = async (params: { jobId: string; status: "open" | "closed" }) => {
  return axiosInstance.patch(`/jobs/${params.jobId}/status`, { status: params.status });
};

// ─── 学生 ───

/** 获取学生资料 */
export const fetchStudentProfile = async () => {
  const res = await axiosInstance.get("/auth/me");
  return { ...res.data?.user, role: res.data?.role };
};

/** 获取简历文本 */
export const fetchResumeText = async (resumeId: string): Promise<string> => {
  const res = await axiosInstance.get(`/resume/${resumeId}/text`);
  return res.data.text as string;
};

/** 获取简历详情 */
export const fetchResumeDetail = async (resumeId: string) => {
  const res = await axiosInstance.get(`/resume/${resumeId}`);
  return res.data;
};

/** 获取当前学生可选的简历库 */
export const fetchMyResumes = async (): Promise<ResumeSummary[]> => {
  const res = await axiosInstance.get("/resume");
  return (res.data?.resumes || []) as ResumeSummary[];
};

export const setDefaultResume = async (resumeId: string) => {
  return axiosInstance.patch(`/resume/${resumeId}/default`);
};

export const archiveResume = async (resumeId: string) => {
  return axiosInstance.delete(`/resume/${resumeId}`);
};

export const updateResumeTitle = async (resumeId: string, title: string) => {
  return axiosInstance.patch(`/resume/${resumeId}`, { title });
};
