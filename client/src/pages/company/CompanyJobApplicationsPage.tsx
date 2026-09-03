import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Users, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { fetchJobDetail, fetchJobApplicationsPage } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { statusColors, statusLabels } from "./shared/constants";
import type { Application } from "@/types";
import PaginationControls from "@/components/shared/PaginationControls";

const CompanyJobApplicationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: job, loading: jobLoading, error: jobError } = useFetch(() => fetchJobDetail(id!), [id], { enabled: !!id });
  const { data: applications, loading: appsLoading, error: appsError } = useFetch(() => fetchJobApplicationsPage(id!, page), [id, page], { enabled: !!id });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const loading = jobLoading || appsLoading;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
  if (jobError || appsError) return <div className="p-6 text-red-500">获取职位或申请列表失败</div>;
  if (!job) return <div className="p-6 text-gray-600 dark:text-gray-300">职位不存在</div>;

  const normalizeStatus = (status: string): Application["status"] => {
    if (status === "in-process") return "in-progress";
    return status as Application["status"];
  };

  const groupedApps: Record<Application["status"], Application[]> = {
    applied: [],
    "in-progress": [],
    selected: [],
    "final-selected": [],
    rejected: [],
  };

  (applications?.items ?? []).forEach((app: Application) => {
    const normalized = normalizeStatus(app.status);
    if (groupedApps[normalized]) {
      groupedApps[normalized].push(app);
    }
  });

  const toggleGroup = (status: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/company/jobs")}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            职位申请列表
          </h2>
        </div>

        <Card className="rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-[#181c2f]/80 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {job.title}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  发布于 {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge
                className={
                  job.status === "open"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }
              >
                {job.status === "open" ? "招聘中" : "已结束"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {job.description}
            </p>
          </CardContent>
        </Card>

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
                    暂无此类申请
                  </p>
                ) : (
                  apps.map((app) => (
                    <div
                      key={app._id}
                      className="group p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50 dark:from-[#1E293B] dark:to-[#23263A] hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                      onClick={() =>
                        navigate(`/company/job/${job._id}/${app._id}`)
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {app.candidateId?.fullName || "未知候选人"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {app.candidateId?.email}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            申请时间：{new Date(app.createdAt || "").toLocaleDateString()}
                          </p>
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
        {applications && <PaginationControls pagination={applications.pagination} onPageChange={setPage} />}
      </div>
    </div>
  );
};

export default CompanyJobApplicationsPage;
