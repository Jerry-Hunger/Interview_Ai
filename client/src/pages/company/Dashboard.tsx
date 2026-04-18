import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";

const COLORS = ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

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

const CompanyDashboard = () => {
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

  const chartData = [
    { name: "已申请", value: stats?.applied || 0 },
    { name: "面试中", value: stats?.inProgress || 0 },
    { name: "已通过", value: stats?.selected || 0 },
    { name: "最终通过", value: stats?.finalSelected || 0 },
    { name: "已拒绝", value: stats?.rejected || 0 },
  ];

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="text-indigo-500 dark:text-indigo-400" />
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
              <Users className="text-purple-500 dark:text-purple-400" />
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
              <CheckCircle className="text-green-500 dark:text-green-400" />
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
              <XCircle className="text-red-500 dark:text-red-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已拒绝</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stats?.rejected || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            申请流程
          </h2>
          {stats && (stats.applied > 0 || stats.inProgress > 0 || stats.selected > 0 || stats.finalSelected > 0 || stats.rejected > 0) ? (
            <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">暂无申请数据</p>
              <p className="text-sm">发布职位后，将显示申请流程统计</p>
            </div>
          )}
        </div>

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
                    onClick={() =>
                      (window.location.href = `/company/job/${job._id}`)
                    }
                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 dark:bg-indigo-600 dark:hover:bg-indigo-700"
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
                    onClick={() =>
                      (window.location.href = `/company/job/${app.jobId?._id}/${app._id}`)
                    }
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 dark:bg-purple-600 dark:hover:bg-purple-700"
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
