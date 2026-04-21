import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyApplications } from "@/hooks/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";

type Application = {
  _id: string;
  jobId: { _id: string; title: string };
  status:
    | "applied"
    | "in-progress"
    | "selected"
    | "final-selected"
    | "rejected";
  createdAt: string;
  currentRound?: number;
};

const statusLabels: Record<Application["status"], string> = {
  applied: "已申请",
  "in-progress": "面试中",
  selected: "已通过",
  "final-selected": "最终通过",
  rejected: "已拒绝",
};

const statusColors: Record<Application["status"], string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "in-progress":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "final-selected":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: applications = [], isPending: loading } = useMyApplications();
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
  applications.forEach((app) => {
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

  if (loading) return <><PageSkeleton variant="table" /></>;

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <Briefcase className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          我的申请
        </h2>

        {Object.entries(groupedApps).map(([status, apps]) => (
          <Card
            key={status}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <CardHeader
              onClick={() => toggleGroup(status)}
              className="cursor-pointer flex flex-row justify-between items-center"
            >
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#23263A] hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {app.jobId?.title}
                        </p>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        申请时间：{new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.currentRound !== undefined && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          当前轮次：第 {app.currentRound + 1} 轮
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </>
  );
};

export default StudentApplicationsPage;
