import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  List,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCompanyDashboard } from "@/hooks/api";

const STAGES = [
  { key: "applied", label: "已申请", color: "#6366F1", bg: "bg-indigo-500" },
  { key: "inProgress", label: "面试中", color: "#F59E0B", bg: "bg-amber-500" },
  { key: "selected", label: "已通过", color: "#10B981", bg: "bg-emerald-500" },
  { key: "finalSelected", label: "最终通过", color: "#8B5CF6", bg: "bg-violet-500" },
  { key: "rejected", label: "已拒绝", color: "#EF4444", bg: "bg-red-500" },
] as const;

const statusLabels: Record<string, string> = {
  applied: "已申请",
  "in-progress": "面试中",
  selected: "已通过",
  "final-selected": "最终通过",
  rejected: "已拒绝",
};

const statusColors: Record<string, string> = {
  applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "final-selected": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

type Stats = {
  applied?: number;
  inProgress?: number;
  selected?: number;
  finalSelected?: number;
  rejected?: number;
  totalJobs?: number;
  totalApplications?: number;
};

type Job = {
  _id: string;
  title: string;
  description: string;
  createdAt?: string;
};

type Application = {
  _id: string;
  jobId: { _id: string; title: string } | null;
  candidateId: { _id: string; fullName: string; email?: string } | null;
  status: string;
  createdAt?: string;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) => (
  <Card className="bg-white dark:bg-[#181c2f] shadow-sm hover:shadow-lg rounded-2xl transition-shadow duration-300 overflow-hidden group">
    <div className={`h-1 w-full ${bgColor}`} />
    <CardContent className="p-5 flex items-center gap-4">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
          {value}
        </h2>
      </div>
    </CardContent>
  </Card>
);

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { data, isPending, error } = useCompanyDashboard();
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);
  const stats = data?.stats ?? null;
  const jobs = data?.jobs || [];
  const recentApps = data?.recentApplications || [];

  useEffect(() => {
    if (!isPending) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  const total = stats
    ? (stats.applied || 0) + (stats.inProgress || 0) + (stats.selected || 0) + (stats.finalSelected || 0) + (stats.rejected || 0)
    : 0;

  const chartData = STAGES.map((s) => ({
    name: s.label,
    value: stats?.[s.key] || 0,
  })).filter((d) => d.value > 0);

  const hasData = total > 0;

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle size={32} className="text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400 text-lg">加载仪表盘失败</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">请刷新页面重试</p>
        </div>
      </div>
    );
  }

  const passRate = total > 0 ? (((stats?.selected || 0) + (stats?.finalSelected || 0)) / total * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
            企业仪表盘
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            管理您的职位和追踪候选人申请状态
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="职位总数" value={stats?.totalJobs || 0} color="#6366F1" bgColor="bg-indigo-500" />
          <StatCard icon={Users} label="申请总数" value={stats?.totalApplications || 0} color="#8B5CF6" bgColor="bg-violet-500" />
          <StatCard icon={CheckCircle} label="已通过" value={stats?.selected || 0} color="#10B981" bgColor="bg-emerald-500" />
          <StatCard icon={XCircle} label="已拒绝" value={stats?.rejected || 0} color="#EF4444" bgColor="bg-red-500" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/company/job/new")}
            className="group flex items-center gap-4 p-4 bg-white dark:bg-[#181c2f] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Plus size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">发布新职位</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">创建新的招聘职位</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </button>
          <button
            onClick={() => navigate("/company/jobs")}
            className="group flex items-center gap-4 p-4 bg-white dark:bg-[#181c2f] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
              <List size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">查看职位列表</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">管理已发布的职位</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Application Pipeline */}
        <div className="bg-white dark:bg-[#181c2f] shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                申请流程
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              追踪所有候选人从申请到最终结果的完整流程
            </p>
          </div>

          {hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Donut Chart */}
              <div className="flex justify-center">
                <div className="relative w-[240px] h-[240px]">
                  <svg
                    viewBox="0 0 240 240"
                    width="240"
                    height="240"
                    className="block"
                  >
                    {(() => {
                      const radius = 85;
                      const circumference = 2 * Math.PI * radius;
                      const gap = 3;
                      const totalGap = chartData.length * gap;
                      const available = circumference - totalGap;
                      let accumulatedOffset = 0;

                      return chartData.map((entry, index) => {
                        const stage = STAGES.find((s) => s.label === entry.name);
                        const segmentLength = total > 0 ? (entry.value / total) * available : 0;
                        const offset = circumference * 0.25 - accumulatedOffset;
                        accumulatedOffset += segmentLength + gap;

                        return (
                          <circle
                            key={`seg-${index}`}
                            cx="120"
                            cy="120"
                            r={radius}
                            fill="none"
                            stroke={stage?.color || "#888"}
                            strokeWidth={36}
                            strokeDasharray={`${animated ? segmentLength : 0} ${circumference - (animated ? segmentLength : 0)}`}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                            className="cursor-pointer transition-all duration-700 ease-out"
                            style={{ opacity: hoveredSegment !== null && hoveredSegment !== index ? 0.4 : 1 }}
                            onMouseEnter={() => setHoveredSegment(index)}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{total}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">总申请</span>
                  </div>
                  {/* Hover Tooltip */}
                  {hoveredSegment !== null && chartData[hoveredSegment] && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+50px)] pointer-events-none z-10">
                      <div className="bg-white dark:bg-[#23263A] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {chartData[hoveredSegment].name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {chartData[hoveredSegment].value} 人 (
                          {(total > 0
                            ? ((chartData[hoveredSegment].value / total) * 100).toFixed(0)
                            : "0")}
                          %)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Funnel Progress Bars */}
              <div className="space-y-4">
                {STAGES.map((stage, idx) => {
                  const count = stats?.[stage.key] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={stage.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {stage.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                            {count}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums w-8 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: animated ? `${pct}%` : "0%",
                            backgroundColor: stage.color,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      {idx < STAGES.length - 1 && (
                        <div className="flex justify-center my-1">
                          <ArrowRight
                            size={12}
                            className="text-gray-300 dark:text-gray-600 rotate-90"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Pass Rate */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" />
                    <span className="text-gray-600 dark:text-gray-400">通过率</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{passRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <BarChart3 size={28} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-1">暂无申请数据</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">发布职位后，将显示申请流程统计</p>
              <Button
                onClick={() => navigate("/company/job/new")}
                className="bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
              >
                发布新职位
              </Button>
            </div>
          )}
        </div>

        {/* Active Jobs */}
        <div className="bg-white dark:bg-[#181c2f] shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                进行中的职位
              </h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">({jobs.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate(`/company/job/${job._id}`)}
                  className="group p-4 rounded-xl bg-gray-50 dark:bg-[#1e2240] hover:bg-indigo-50 dark:hover:bg-[#232a48] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors truncate">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {job.description}
                      </p>
                      {job.createdAt && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <Clock size={12} />
                          {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/job/${job._id}`);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      查看申请
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Briefcase size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-3">暂无进行中的职位</p>
                <Button
                  onClick={() => navigate("/company/job/new")}
                  variant="outline"
                  className="border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
                >
                  发布第一个职位
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-[#181c2f] shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                最近申请
              </h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">({recentApps.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {recentApps.length > 0 ? (
              recentApps.map((app) => (
                <div
                  key={app._id}
                  onClick={() => navigate(`/company/job/${app.jobId?._id}/${app._id}`)}
                  className="group p-4 rounded-xl bg-gray-50 dark:bg-[#1e2240] hover:bg-purple-50 dark:hover:bg-[#242042] border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                          {app.candidateId?.fullName || "未知候选人"}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[app.status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        申请了 <span className="font-medium text-gray-600 dark:text-gray-300">{app.jobId?.title}</span>
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/job/${app.jobId?._id}/${app._id}`);
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <FileText size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-3">暂无最近申请</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">发布职位后，候选人可以投递申请</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
