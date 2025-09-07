// src/pages/company/CompanyDashboard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";

const COLORS = ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

const CompanyDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);

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
        console.error("Error loading dashboard:", err);
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = [
    { name: "Applied", value: stats?.applied || 0 },
    { name: "In-Process", value: stats?.inProgress || 0 },
    { name: "Selected", value: stats?.selected || 0 },
    { name: "Final-Selected", value: stats?.finalSelected || 0 },
    { name: "Rejected", value: stats?.rejected || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
          Company Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Manage your jobs and track candidate applications at a glance.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="text-indigo-500" />
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <h2 className="text-xl font-semibold">
                  {stats?.totalJobs || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <h2 className="text-xl font-semibold">
                  {stats?.totalApplications || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Selected</p>
                <h2 className="text-xl font-semibold">
                  {stats?.selected || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#181c2f] shadow-md rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <h2 className="text-xl font-semibold">
                  {stats?.rejected || 0}
                </h2>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Pipeline Chart */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            Applications Pipeline
          </h2>
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
        </div>

        {/* Jobs List */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            Active Jobs
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
                    className="bg-indigo-500 text-white rounded-lg px-4 py-2"
                  >
                    View Applications
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No active jobs</p>
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mt-10 bg-white dark:bg-[#181c2f] shadow-md rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            Recent Applications
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
                      {app.candidateId.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Applied for {app.jobId.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {app.status}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      (window.location.href = `/company/job/${app.jobId._id}/${app._id}`)
                    }
                    className="bg-purple-500 text-white rounded-lg px-4 py-2"
                  >
                    View
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No recent applications
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
