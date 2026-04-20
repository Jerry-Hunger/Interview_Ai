import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";

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
};

type Application = {
  _id: string;
  jobId: { _id: string; title: string } | null;
  candidateId: { _id: string; fullName: string; email?: string } | null;
  status: string;
};

const CustomTooltip = ({ active, payload, chartTotal }: { active?: boolean; payload?: { name: string; value: number }[]; chartTotal?: number }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = chartTotal && chartTotal > 0 ? ((d.value / chartTotal) * 100).toFixed(0) : "0";
  return (
    <div className="bg-white dark:bg-[#23263A] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {d.value} 人 ({pct}%)
      </p>
    </div>
  );
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApps, setRecentApps] = useState<Application[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axiosInstance.get("/company/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setStats(res.data.stats);
        setJobs(res.data.jobs);
        setRecentApps(res.data.recentApplications);
      } catch (err) {
        console.error("加载仪表盘失败:", err);
      }
    };
    fetchDashboardData();
  }, []);

  const total = stats
    ? (stats.applied || 0) + (stats.inProgress || 0) + (stats.selected || 0) + (stats.finalSelected || 0) + (stats.rejected || 0)
    : 0;

  const chartData = STAGES.map((s) => ({
    name: s.label,
    value: stats?.[s.key] || 0,
  })).filter((d) => d.value > 0);

  const hasData = total > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
          企业仪表盘
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          管理您的职位和追踪候选人申请状态
        </p>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="text-indigo-500 dark:text-indigo-400" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">职位总数</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats?.totalJobs || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="text-purple-500 dark:text-purple-400" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">申请总数</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats?.totalApplications || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500 dark:text-green-400" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已通过</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats?.selected || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="text-red-500 dark:text-red-400" size={24} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已拒绝</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats?.rejected || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Pipeline */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
            申请流程
          </h2>

          {hasData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Donut Chart */}
              <div className="flex justify-center">
                <div className="relative w-[260px] h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STAGES.find((s) => s.label === entry.name)?.color || "#888"}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip chartTotal={total} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">总申请</span>
                  </div>
                </div>
              </div>

              {/* Funnel Progress Bars */}
              <div className="space-y-4">
                {STAGES.map((stage, idx) => {
                  const count = stats?.[stage.key] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={stage.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {stage.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {count}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
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
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">暂无申请数据</p>
              <p className="text-sm">发布职位后，将显示申请流程统计</p>
            </div>
          )}
        </div>

        {/* Active Jobs */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            进行中的职位
          </h2>
          <div className="space-y-4">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div
                  key={job._id}
                  className="p-4 rounded-xl bg-indigo-50 dark:bg-[#20263d] flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {job.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/company/job/${job._id}`)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    查看申请
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">暂无进行中的职位</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            最近申请
          </h2>
          <div className="space-y-4">
            {recentApps.length > 0 ? (
              recentApps.map((app) => (
                <div
                  key={app._id}
                  className="p-4 rounded-xl bg-purple-50 dark:bg-[#20263d] flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {app.candidateId?.fullName || "未知候选人"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      申请了 {app.jobId?.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      状态：{statusLabels[app.status] || app.status}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/company/job/${app.jobId?._id}/${app._id}`)}
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    查看详情
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                暂无最近申请
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
