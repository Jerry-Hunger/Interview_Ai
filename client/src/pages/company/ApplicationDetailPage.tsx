import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { useApplicationDetail } from "@/hooks/api";

type Application = {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    rounds: { roundNumber: number; type: string }[];
  };
  candidateId: {
    _id: string;
    fullName: string;
    email: string;
    skills?: string[];
  };
  resumeId?: {
    _id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
  };
  currentRound: number;
  status:
    | "applied"
    | "in-progress"
    | "selected"
    | "final-selected"
    | "rejected";
  history: {
    roundNumber: number;
    interviewId?: string;
    result: string;
    feedback: string;
  }[];
};

const statusLabels: Record<string, string> = {
  applied: "已申请",
  "in-progress": "面试中",
  selected: "已通过",
  "final-selected": "最终通过",
  rejected: "已拒绝",
};

const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{
    applicationId: string;
  }>();
  const navigate = useNavigate();

  const { data: application, isPending, error, } = useApplicationDetail(applicationId!);
  const [showResume, setShowResume] = useState(false);
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (newStatus: Application["status"]) => {
    if (!application) return;
    setUpdating(true);
    try {
      await axiosInstance.patch(
        `/applications/${(application as Application)._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Note: after mutation, React Query will need invalidation for full refresh
      // For now we rely on the local state update pattern
    } catch (err) {
      console.error("更新状态失败", err);
      alert("更新状态失败");
    } finally {
      setUpdating(false);
    }
  };

  if (isPending) return <PageSkeleton variant="detail" />;
  if (error) return <div className="p-6 text-red-500">获取申请详情失败</div>;
  if (!application) return <div className="p-6 text-gray-600 dark:text-gray-300">申请不存在</div>;

  const app = application as Application;
  const completedRounds = app.history?.length || 0;
  const totalRounds = app.jobId.rounds?.length || 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card className="rounded-2xl shadow-lg bg-white dark:bg-[#181c2f]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
              {app.candidateId?.fullName} - {app.jobId?.title}
            </CardTitle>
            <Badge
              variant={
                app.status === "final-selected"
                  ? "secondary"
                  : app.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {statusLabels[app.status] || app.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            邮箱：{app.candidateId?.email}
          </p>

          <div className="flex gap-2">
            <Button onClick={() => setShowResume(true)} variant="outline" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400">
              查看简历
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">面试进度</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              已完成 {completedRounds} / {totalRounds} 轮面试
            </p>
            <div className="mt-3 space-y-2">
              {app.history?.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#23263A]"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      第 {h.roundNumber} 轮
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {h.result === "success" ? "通过" : "未通过"}
                    </span>
                  </div>
                  {h.feedback && (
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                      {h.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => navigate(-1)} variant="outline" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400">
              返回
            </Button>

            {app.status === "applied" && (
              <>
                <Button
                  onClick={() => updateStatus("in-progress")}
                  disabled={updating}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  批准 → 进入面试
                </Button>
                <Button
                  onClick={() => updateStatus("rejected")}
                  disabled={updating}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  拒绝
                </Button>
              </>
            )}

            {app.status === "selected" && (
              <Button
                onClick={() => updateStatus("final-selected")}
                disabled={updating}
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                最终批准
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showResume && (
        <ResumeViewer
          resumeId={app.resumeId?._id}
          onClose={() => setShowResume(false)}
        />
      )}
    </div>
  );
};

export default ApplicationDetailPage;
