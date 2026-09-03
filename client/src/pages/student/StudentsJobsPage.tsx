import { useState } from "react";
import { fetchJobsPage, fetchMyApplicationsPage } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { difficultyConfig } from "@/constants/difficulty";
import type { Job } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Briefcase, Filter, MapPin, Building2, Clock, Layers, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaginationControls from "@/components/shared/PaginationControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StudentJobsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    company: searchParams.get("company") || "",
    rounds: searchParams.get("rounds") || "",
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "open",
  });
  const [page, setPage] = useState(1);

  const { data: jobs, loading: jobsLoading } = useFetch(() => fetchJobsPage(filters, page), [filters, page]);
  const { data: applications, loading: appsLoading } = useFetch(() => fetchMyApplicationsPage(1));
  const loading = jobsLoading || appsLoading;

  const handleFilterChange = (key: string, value: string) => {
    const normalizedValue = value === "all" ? "" : value;
    const newFilters = { ...filters, [key]: normalizedValue };
    setFilters(newFilters);
    setPage(1);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setFilters({
      company: "",
      rounds: "",
      type: "",
      status: "open",
    });
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  // 已申请状态以服务端投递记录为准。
  const appliedJobIds = new Set([
    ...(applications?.items ?? []).map((a: { jobId: { _id: string } | string }) => {
      const jobId = a.jobId;
      const id = typeof jobId === "object" && jobId !== null ? jobId._id : jobId;
      return String(id ?? "");
    }),
  ]);

  /** 投递职位 */
  const applyJob = (jobId: string) => {
    // 投递前必须在详情页选择简历，避免隐式使用不符合岗位的默认版本。
    navigate(`/student/jobs/${jobId}`);
  };

  const renderJobCard = (job: Job, type: "open" | "closed" | "applied") => {
    const alreadyApplied = appliedJobIds.has(String(job._id));
    const isOpen = type === "open";
    const diff = difficultyConfig[job.difficulty as keyof typeof difficultyConfig];

    return (
      <Card className="group rounded-2xl border-0 bg-white dark:bg-gray-900 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        {/* 顶部渐变装饰条 */}
        <div className={`h-1 ${isOpen ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600'}`} />
        {/* 卡片头部 - 渐变背景 */}
        <div className={`relative p-5 ${isOpen ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600' : 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700'}`}>
          {/* 状态标签 */}
          <div className="absolute top-4 right-4">
            <Badge className={isOpen
              ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
              : "bg-white/20 text-white/80 border border-white/20 backdrop-blur-sm"
            }>
              {isOpen ? "✅ 招聘中" : "❌ 已结束"}
            </Badge>
          </div>

          {/* 公司 Logo + 职位信息 */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white shadow-md p-1.5 flex items-center justify-center overflow-hidden shrink-0">
              {job.companyLogoUrl ? (
                <img src={job.companyLogoUrl} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-xl font-bold text-white cursor-pointer hover:underline decoration-white/50"
                onClick={() => navigate(`/student/jobs/${job._id}`)}
              >
                {job.title}
              </h3>
              {job.companyName && (
                <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {job.companyName}
                </p>
              )}
              {job.companyLocation && (
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {job.companyLocation}
                </p>
              )}
            </div>
          </div>

          {/* 难度标签 */}
          {diff && (
            <div className="absolute bottom-4 right-4">
              <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                {diff.label}
              </Badge>
            </div>
          )}
        </div>

        {/* 卡片内容 */}
        <CardContent className="p-5 space-y-4">
          {/* 简介 */}
          {job.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
          )}

          {/* 技能要求 */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>技能要求</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {skill}
                  </span>
                ))}
                {job.skills.length > 4 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    +{job.skills.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 面试环节 */}
          {job.rounds && job.rounds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Layers className="w-3.5 h-3.5" />
                <span>面试环节 · {job.rounds.length} 轮</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.rounds.map((r, i) => {
                  const roundDiff = difficultyConfig[r.difficulty as keyof typeof difficultyConfig];
                  return (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {r.type === "technical" ? "技术面" : r.type === "behavioral" ? "行为面" : r.type || "面试"}
                      </span>
                      {roundDiff && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roundDiff.badge}`}>
                          {roundDiff.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 底部操作栏 */}
          <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
            </span>
            <div className="flex gap-2">
              {isOpen && (
                <Button
                  onClick={() => applyJob(job._id)}
                  disabled={alreadyApplied}
                  size="sm"
                  className={`gap-1.5 ${alreadyApplied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} text-white shadow-md transition-all`}
                >
                  {alreadyApplied ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> 已申请</>
                  ) : (
                    <><span>立即申请</span><ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/student/jobs/${job._id}`)}
                className="gap-1.5"
              >
                查看详情
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto py-10 px-4 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">职位列表</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">发现适合你的机会</p>
          </div>
        </div>

        {/* 筛选区域 */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Filter size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 dark:text-gray-400">公司名称</Label>
              <Input
                placeholder="搜索公司..."
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
                className="bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 dark:text-gray-400">面试轮次</Label>
              <Select value={filters.rounds} onValueChange={(v) => handleFilterChange("rounds", v)}>
                <SelectTrigger className="bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="1">1轮</SelectItem>
                  <SelectItem value="2">2轮</SelectItem>
                  <SelectItem value="3">3轮</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 dark:text-gray-400">面试类型</Label>
              <Select value={filters.type} onValueChange={(v) => handleFilterChange("type", v)}>
                <SelectTrigger className="bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="technical">技术面</SelectItem>
                  <SelectItem value="behavioral">行为面</SelectItem>
                  <SelectItem value="hr">HR面</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500 dark:text-gray-400">职位状态</Label>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange("status", v)}>
                <SelectTrigger className="bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#23263A]">
                  <SelectItem value="open">招聘中</SelectItem>
                  <SelectItem value="closed">已结束</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700"
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        {/* 职位列表 */}
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <LoadingSpinner size="lg" text="加载中..." />
          </div>
        ) : (
          <>
            {(jobs?.items ?? []).length === 0 ? (
              <div className="text-center py-16 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Briefcase className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">暂无符合条件的职位</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(jobs?.items ?? []).map((job) => renderJobCard(job, job.status === "open" ? "open" : "closed"))}
              </div>
            )}
            {jobs && <PaginationControls pagination={jobs.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default StudentJobsPage;
