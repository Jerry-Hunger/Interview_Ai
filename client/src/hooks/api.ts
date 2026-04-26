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
      return res.data?.jobs || [];
    },
    staleTime: 60 * 1000,
  });
};

export const useJobDetail = (id: string) =>
  useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${id}`, authHeader());
      return res.data?.job;
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
      return res.data?.applications || [];
    },
    staleTime: 60 * 1000,
  });

export const useApplicationDetail = (id: string) =>
  useQuery({
    queryKey: ["applications", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/applications/${id}`, authHeader());
      return res.data?.application;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

export const useJobApplications = (jobId: string) =>
  useQuery({
    queryKey: ["applications", "job", jobId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/applications/job/${jobId}`, authHeader());
      return res.data?.applications || [];
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
      return res.data?.jobs || [];
    },
    staleTime: 60 * 1000,
    refetchOnMount: "always",
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

// ─── Company Mutations ───
export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; skills: string[]; rounds: unknown[] }) =>
      axiosInstance.post("/jobs", data, authHeader()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "jobs"] });
      qc.invalidateQueries({ queryKey: ["company", "dashboard"] });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      axiosInstance.patch(`/applications/${id}`, { status }, authHeader()),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["applications", id] });
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["company", "dashboard"] });
    },
  });
};

export const useUpdateCompanyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      axiosInstance.put("/company/profile", data, authHeader()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "profile"] });
    },
  });
};

export const useUploadPhotos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      const res = await axiosInstance.post("/upload/photos", formData, {
        headers: { "Content-Type": "multipart/form-data", ...authHeader().headers },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "profile"] });
    },
  });
};

export const useDeleteCompanyPhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      axiosInstance.delete("/company/photos", { ...authHeader(), data: { url } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", "profile"] });
    },
  });
};

// ─── Student ───
export const useStudentProfile = () =>
  useQuery({
    queryKey: ["student", "profile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me", authHeader());
      return { ...res.data?.user, role: res.data?.role };
    },
    staleTime: 2 * 60 * 1000,
  });

export const useResumeText = (resumeId: string | undefined) =>
  useQuery({
    queryKey: ["resume", resumeId, "text"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/resume/${resumeId}/text`, authHeader());
      return res.data.text as string;
    },
    enabled: !!resumeId,
    staleTime: 5 * 60 * 1000,
  });

export const useResumeDetail = (resumeId: string | undefined) =>
  useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/resume/${resumeId}`, authHeader());
      return res.data;
    },
    enabled: !!resumeId,
    staleTime: 5 * 60 * 1000,
  });

// ─── Resume CRUD ───
export const useResumes = (userId: string | undefined) =>
  useQuery({
    queryKey: ["resumes", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/resume/user/${userId}`, authHeader());
      return res.data as any[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });

export const useCreateResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; fileUrl: string; fileName: string; fileType: string; text?: string }) =>
      axiosInstance.post("/resume", data, authHeader()),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["resumes", studentId] });
    },
  });
};

export const useUpdateResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; fileName?: string; isDefault?: boolean; studentId: string }) =>
      axiosInstance.put(`/resume/${id}`, data, authHeader()),
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: ["resumes", studentId] });
    },
  });
};

export const useDeleteResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) =>
      axiosInstance.delete(`/resume/${id}`, authHeader()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
};
