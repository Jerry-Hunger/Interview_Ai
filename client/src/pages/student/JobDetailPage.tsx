import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Calendar, Layers, Building2, MapPin, Globe, Sparkles, Clock, CheckCircle2, ArrowRight, Briefcase } from "lucide-react";
import { fetchJobDetail, fetchMyApplications, applyJob as applyJobApi } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/use-toast";
import MarkdownText from "@/components/resume/MarkdownText";
import type { JobRound } from "@/types";
import { difficultyConfig } from "@/constants/difficulty";
import { roundTypeConfig } from "@/constants/roundType";

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, loading } = useFetch(() => fetchJobDetail(id!), [id], { enabled: !!id });
  const { data: applications } = useFetch(() => fetchMyApplications());
  const [applying, setApplying] = useState(false);
  /** 本地标记是否刚申请成功，避免refetch刷新界面 */
  const [localApplied, setLocalApplied] = useState(false);
  const { toast } = useToast();

  const hasApplied = localApplied || (applications ?? []).some((a: { jobId: string | { _id: string } }) => {
    const jobId = a.jobId;
    const jid = typeof jobId === "object" && jobId !== null ? jobId._id : jobId;
    return jid?.toString() === id?.toString();
  });

  const handleApply = async () => {
    if (hasApplied) {
      toast({ title: "您已申请过该职位", description: "请勿重复申请", variant: "destructive" });
      return;
    }
    setApplying(true);
    try {
      await applyJobApi(id!);
      toast({ title: "申请成功", description: "请等待HR审核" });
      setLocalApplied(true);
    } catch (err: unknown) {
      console.error("Apply failed", err);
      const axiosError = err as { response?: { data?: { msg?: string } } };
      toast({ title: "申请失败", description: axiosError.response?.data?.msg ?? "申请失败", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
  if (!job) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <p className="text-gray-600 dark:text-gray-300">职位不存在</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">职位详情</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">查看职位信息并申请</p>
          </div>
        </div>

        {/* 公司信息卡片 */}
        {job.companyName && (
          <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-r from-white to-slate-50 dark:from-gray-900 dark:to-gray-800/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="flex items-start gap-5">
                {/* Logo 区域 */}
                <div className="shrink-0">
                  {job.companyLogoUrl ? (
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border border-slate-100 p-1.5 flex items-center justify-center overflow-hidden">
                        <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Building2 className="w-9 h-9 text-white" />
                    </div>
                  )}
                </div>

                {/* 公司信息 */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {job.companyName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {job.companyLocation && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />{job.companyLocation}
                      </span>
                    )}
                    {job.industry && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">{job.industry}</span>
                    )}
                    {job.companySize && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="w-3.5 h-3.5 text-purple-500" />{job.companySize} 人
                      </span>
                    )}
                    {job.companyWebsite && (
                      <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                        <Globe className="w-3.5 h-3.5" />官网
                      </a>
                    )}
                  </div>

                  {/* 公司简介 */}
                  {job.companyDescription && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-gray-800/50 dark:to-indigo-900/20 border border-slate-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">公司简介</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownText content={job.companyDescription} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 职位主卡片 */}
        <Card className="rounded-2xl shadow-xl border-0 bg-white dark:bg-gray-900 overflow-hidden">
          {/* 顶部渐变装饰条 */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-sm">{job.title}</h1>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-sm text-white/80">
                    <Calendar className="w-4 h-4" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-white/80">
                    <Clock className="w-4 h-4" />
                    更新于 {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={job.status === "closed"
                  ? "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                  : "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                }>
                  {job.status === "closed" ? "❌ 已结束" : "✅ 招聘中"}
                </Badge>
                {job.difficulty && (
                  <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                    {job.difficulty === "beginner" ? "🌱 初级" : job.difficulty === "intermediate" ? "⚡ 中级" : job.difficulty === "senior" ? "🔥 高级" : job.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-8">
            {/* 职位描述 */}
            <div className="group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">职位描述</h3>
              </div>
              <div className="pl-10">
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 技能要求 */}
            <div className="group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">技能要求</h3>
              </div>
              <div className="pl-10 flex flex-wrap gap-2">
                {(job.skills || []).map((s: string) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* 面试环节 */}
            {job.rounds && job.rounds.length > 0 && (
              <div className="group">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">面试环节</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">共 {job.rounds.length} 轮</span>
                </div>
                <div className="pl-10 space-y-4">
                  {(job.rounds as JobRound[]).map((r: JobRound, idx: number) => {
                    const diff = difficultyConfig[r.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;
                    return (
                      <div key={idx} className="relative p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800/50 dark:to-gray-800 border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        {/* 轮次标记 */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                          {idx + 1}
                        </div>
                        {/* 连接线 */}
                        {idx < (job.rounds?.length ?? 0) - 1 && (
                          <div className="absolute left-3 top-full w-0.5 h-4 bg-gradient-to-b from-indigo-300 to-transparent dark:from-indigo-600" />
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                              {roundTypeConfig[r.type ?? ""]?.icon} {roundTypeConfig[r.type ?? ""]?.label ?? r.type ?? `第 ${idx + 1} 轮面试`}
                            </div>
                            {r.topic && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {r.topic}
                              </div>
                            )}
                            {r.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-0">
                                💬 {r.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${diff.color}`}>
                              {diff.label}
                            </span>
                            {r.duration && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />{r.duration} 分钟
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 申请按钮区域 */}
            <div className="pt-6 border-t border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {hasApplied && <><CheckCircle2 className="w-4 h-4 text-green-500" />您已申请该职位</>}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => navigate(-1)} variant="outline" size="lg" className="gap-2">
                    ← 返回
                  </Button>
                  {job.status !== "closed" && (
                    <Button
                      onClick={handleApply}
                      disabled={applying || hasApplied}
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      {hasApplied
                        ? <>已申请 <CheckCircle2 className="w-4 h-4" /></>
                        : applying
                        ? "申请中..."
                        : <>申请职位 <ArrowRight className="w-4 h-4" /></>
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobDetailPage;
