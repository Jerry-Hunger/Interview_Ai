import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyApplications, type Application } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";

const statusLabels: Record<Application["status"], string> = {
  applied: "已申请",
  "in-progress": "面试中",
  selected: "已通过",
  "final-selected": "最终通过",
  rejected: "已拒绝",
};

const statusColors: Record<Application["status"], string> = {
  applied: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  selected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "final-selected": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: applications, loading, refetch } = useFetch(() => fetchMyApplications());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const groupedApps: Record<Application["status"], Application[]> = {
    applied: [],
    "in-progress": [],
    selected: [],
    "final-selected": [],
    rejected: [],
  };
  (applications ?? []).forEach((app) => {
    if (groupedApps[app.status]) {
      groupedApps[app.status].push(app);
    }
  });

  const toggleGroup = (status: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Briefcase className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          我的申请
        </h2>

        {Object.entries(groupedApps).map(([status, apps]) => (
          <Card
            key={status}
            className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md shadow-sm overflow-hidden"
          >
            <CardHeader
              onClick={() => toggleGroup(status)}
              className="cursor-pointer flex flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors rounded-t-2xl"
            >
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  status === "applied" ? "bg-blue-500" :
                  status === "in-progress" ? "bg-amber-500" :
                  status === "selected" ? "bg-emerald-500" :
                  status === "final-selected" ? "bg-purple-500" :
                  "bg-red-500"
                }`} />
                {statusLabels[status as Application["status"]]} ({apps.length})
              </CardTitle>
              {expandedGroups[status] ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </CardHeader>
            {expandedGroups[status] && (
              <CardContent className="space-y-4">
                {apps.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    暂无此类申请。
                  </p>
                ) : (
                  apps.map((app) => (
                    <div
                      key={app._id}
                      onClick={() =>
                        navigate(`/student/application/${app._id}`)
                      }
                      className="group p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-[#1E293B] dark:to-[#23263A] hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {app.jobId?.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            申请时间：{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "未知"}
                          </p>
                          {app.currentRound !== undefined && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              当前轮次：第 {app.currentRound + 1} 轮
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-3">
                          <Badge className={statusColors[app.status]}>
                            {statusLabels[app.status]}
                          </Badge>
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            点击查看 →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      </div>
    </>
  );
};

export default StudentApplicationsPage;
