import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// ─── Interview ───
export const useMyInterviews = () =>
  useQuery({
    queryKey: ["interviews", "mine"],
    queryFn: async () => {
      const res = await axiosInstance.get("/interview/mine", authHeader());
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
    staleTime: 2 * 60 * 1000,
  });

// ─── Jobs ───
export const useJobs = (filters: Record<string, string>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.append(k, v);
  });
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs?${params.toString()}`, authHeader());
      return res.data || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useJobDetail = (id: string) =>
  useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${id}`, authHeader());
      return res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

// ─── Applications ───
export const useMyApplications = () =>
  useQuery({
    queryKey: ["applications", "mine"],
    queryFn: async () => {
      const res = await axiosInstance.get("/applications/mine", authHeader());
      return res.data || [];
    },
    staleTime: 60 * 1000,
  });

export const useApplicationDetail = (id: string) =>
  useQuery({
    queryKey: ["applications", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/applications/${id}`, authHeader());
      return res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

export const useJobApplications = (jobId: string) =>
  useQuery({
    queryKey: ["applications", "job", jobId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/applications/job/${jobId}`, authHeader());
      return res.data || [];
    },
    enabled: !!jobId,
    staleTime: 60 * 1000,
  });

export const useApplyJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      axiosInstance.post("/applications", { jobId }, authHeader()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

// ─── Company ───
export const useCompanyDashboard = () =>
  useQuery({
    queryKey: ["company", "dashboard"],
    queryFn: async () => {
      const res = await axiosInstance.get("/company/dashboard", authHeader());
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

export const useCompanyJobs = () =>
  useQuery({
    queryKey: ["company", "jobs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/jobs/company", authHeader());
      return res.data || [];
    },
    staleTime: 60 * 1000,
  });

export const useCompanyProfile = () =>
  useQuery({
    queryKey: ["company", "profile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/company/profile", authHeader());
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

// ─── Student ───
export const useStudentProfile = () =>
  useQuery({
    queryKey: ["student", "profile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/resume/profile", authHeader());
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
