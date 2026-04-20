import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Briefcase, Filter } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Job = {
  _id: string;
  title: string;
  description?: string;
  skills?: string[];
  rounds?: { type?: string; description?: string }[];
  difficulty?: string;
  createdAt?: string;
  status?: "open" | "closed";
  companyName?: string;
  companyLogoUrl?: string;
  companyLocation?: string;
};

type Application = {
  _id: string;
  jobId: { _id: string } | string;
  status: string;
  currentRound?: string;
  createdAt?: string;
};

const StudentJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    company: searchParams.get("company") || "",
    rounds: searchParams.get("rounds") || "",
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "open",
  });

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.company) params.append("company", filters.company);
      if (filters.rounds) params.append("rounds", filters.rounds);
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);

      const [jobsRes, appsRes] = await Promise.all([
        axiosInstance.get(`/jobs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axiosInstance.get("/applications/mine", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      console.error("Error fetching jobs/apps", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const normalizedValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: normalizedValue };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    setSearchParams(params);
  };

  const appliedJobIds = new Set(
    applications.map((a) => {
      const jobId = a.jobId;
      const id = typeof jobId === "object" && jobId !== null ? jobId._id : jobId;
      return String(id ?? "");
    })
  );

  const applyJob = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      await axiosInstance.post(
        "/applications",
        { jobId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const appsRes = await axiosInstance.get("/applications/mine", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setApplications(appsRes.data || []);
    } catch (err: unknown) {
      console.error("Apply failed", err);
      const axiosError = err as { response?: { data?: { msg?: string } } };
      const msg = axiosError.response?.data?.msg ?? "申请失败，请重试。";
      alert(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const renderJobCard = (job: Job, type: "open" | "closed" | "applied") => {
    const alreadyApplied = appliedJobIds.has(String(job._id));

    return (
      <Card
        key={job._id}
        className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all bg-white dark:bg-gray-900"
      >
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {job.companyLogoUrl && (
                <img src={job.companyLogoUrl} alt="" className="w-10 h-10 object-contain mb-2 rounded" />
              )}
              <CardTitle
                className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
                onClick={() => navigate(`/student/jobs/${job._id}`)}
              >
                {job.title}
              </CardTitle>
              {job.companyName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.companyName}</p>
              )}
              {job.companyLocation && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{job.companyLocation}</p>
              )}
            </div>
            <Badge
              variant={type === "open" ? "default" : type === "applied" ? "secondary" : "destructive"}
              className="w-fit"
            >
              {type === "open" ? "招聘中" : type === "applied" ? "已申请" : "已结束"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{job.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(job.rounds || []).map((r, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {r.type === "technical" ? "技术面" : r.type === "behavioral" ? "行为面" : "HR面"}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            技能要求：{(job.skills || []).join(", ")}
          </p>
          <div className="mt-4 flex gap-2">
            {type === "open" && (
              <Button
                onClick={() => applyJob(job._id)}
                disabled={applyingId === job._id || alreadyApplied}
                className="flex-1"
              >
                {alreadyApplied ? "已申请" : applyingId === job._id ? "申请中..." : "立即申请"}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/student/jobs/${job._id}`)}>
              查看详情
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Navigation />
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
          <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          职位列表
        </h2>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-700 dark:text-gray-300" />
            <span className="font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">公司名称</Label>
              <Input
                placeholder="搜索公司..."
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">面试轮次</Label>
              <Select
                value={filters.rounds}
                onValueChange={(v) => handleFilterChange("rounds", v)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="1" className="text-gray-900 dark:text-gray-100">1轮</SelectItem>
                  <SelectItem value="2" className="text-gray-900 dark:text-gray-100">2轮</SelectItem>
                  <SelectItem value="3" className="text-gray-900 dark:text-gray-100">3轮</SelectItem>
                  <SelectItem value="4" className="text-gray-900 dark:text-gray-100">4轮</SelectItem>
                  <SelectItem value="4+" className="text-gray-900 dark:text-gray-100">4轮以上</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">面试类型</Label>
              <Select
                value={filters.type}
                onValueChange={(v) => handleFilterChange("type", v)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="technical" className="text-gray-900 dark:text-gray-100">技术面</SelectItem>
                  <SelectItem value="behavioral" className="text-gray-900 dark:text-gray-100">行为面</SelectItem>
                  <SelectItem value="hr" className="text-gray-900 dark:text-gray-100">HR面</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-700 dark:text-gray-300">职位状态</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange("status", v)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="open" className="text-gray-900 dark:text-gray-100">招聘中</SelectItem>
                  <SelectItem value="closed" className="text-gray-900 dark:text-gray-100">已结束</SelectItem>
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        ) : (
          <>
            {jobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">暂无符合条件的职位</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => renderJobCard(job, job.status === "open" ? "open" : "closed"))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default StudentJobsPage;