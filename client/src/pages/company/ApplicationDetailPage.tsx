import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { fetchApplicationDetail, updateApplicationStatus as updateApplicationStatusApi } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { statusLabels } from "@/constants/status";
import type { ApplicationDetail, ApplicationStatus } from "@/types";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{
    applicationId: string;
  }>();
  const navigate = useNavigate();

  const { data: application, loading: isPending, error, refetch } = useFetch(() => fetchApplicationDetail(applicationId!), [applicationId], { enabled: !!applicationId });
  const [updating, setUpdating] = useState(false);
  const [showResume, setShowResume] = useState(false);

  const handleStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (!application) return;
    setUpdating(true);
    try {
      await updateApplicationStatusApi({ id: (application as ApplicationDetail)._id, status: newStatus, jobId: (application as ApplicationDetail).jobId._id });
      refetch();
    } catch {
      alert("更新状态失败");
    } finally {
      setUpdating(false);
    }
  };

  if (isPending) return (
    <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
  if (error) return <div className="p-6 text-red-500">获取申请详情失败</div>;
  if (!application) return <div className="p-6 text-gray-600 dark:text-gray-300">申请不存在</div>;

  const app = application as ApplicationDetail;
  const completedRounds = app.history?.length || 0;
  const totalRounds = app.jobId.rounds?.length || 0;

  const normalizeStatus = (status: string): ApplicationStatus => {
    if (status === "in-process") return "in-progress";
    return status as ApplicationStatus;
  };
  const normalizedStatus = normalizeStatus(app.status);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card className="rounded-2xl shadow-lg bg-white dark:bg-[#181c2f]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
              {app.candidateId?.fullName} - {app.jobId?.title}
            </CardTitle>
            <Badge
              className={
                normalizedStatus === "rejected"
                  ? "bg-red-500 text-white"
                  : normalizedStatus === "in-progress"
                  ? "bg-amber-500 text-white"
                  : normalizedStatus === "applied"
                  ? "bg-blue-500 text-white"
                  : normalizedStatus === "selected"
                  ? "bg-green-500 text-white"
                  : normalizedStatus === "final-selected"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-500 text-white"
              }
            >
              {statusLabels[normalizedStatus] || normalizedStatus}
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
                    <div className="mt-2 text-sm">
                      <MarkdownRenderer content={h.feedback} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => navigate(-1)} variant="outline" className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400">
              返回
            </Button>

            {normalizedStatus === "applied" && (
              <>
                <Button
                  onClick={() => handleStatusUpdate("in-progress")}
                  disabled={updating}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  批准 → 进入面试
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updating}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  拒绝
                </Button>
              </>
            )}

            {normalizedStatus === "selected" && (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg mb-3">
                  <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    学生已通过所有面试轮次，请进行最终审核
                  </span>
                </div>
                <Button
                  onClick={() => handleStatusUpdate("final-selected")}
                  disabled={updating}
                  className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  最终批准
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updating}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  拒绝
                </Button>
              </>
            )}

            {normalizedStatus === "in-progress" && (
              <>
                {app.jobId.rounds && app.jobId.rounds.length > 1 && (app.approvedThrough || 0) < app.jobId.rounds.length ? (
                  // 多轮面试：还有下一轮面试
                  app.history.length >= (app.approvedThrough || 0) ? (
                    // 学生已完成当前已批准轮次的面试，等待企业操作
                    <>
                      <Button
                        onClick={() => handleStatusUpdate("in-progress")}
                        disabled={updating}
                        className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        开启下一轮
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate("rejected")}
                        disabled={updating}
                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        拒绝
                      </Button>
                    </>
                  ) : (
                    // 学生正在面试中，等待学生完成第 {approvedThrough} 轮
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                      <svg className="h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        等待学生进行第 {app.approvedThrough || 0} 轮面试
                      </span>
                    </div>
                  )
                ) : (
                  // 单轮面试 或 多轮面试已完成所有轮次（approvedThrough >= totalRounds）
                  // 此时需要检查学生是否已完成该轮面试
                  app.history.length >= (app.approvedThrough || 0) ? (
                    // 学生已完成当前轮面试，显示最终批准
                    <>
                      <Button
                        onClick={() => handleStatusUpdate("final-selected")}
                        disabled={updating}
                        className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        最终批准
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate("rejected")}
                        disabled={updating}
                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        拒绝
                      </Button>
                    </>
                  ) : (
                    // 学生正在面试中，等待学生完成第 {approvedThrough} 轮
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                      <svg className="h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        等待学生进行第 {app.approvedThrough || 0} 轮面试
                      </span>
                    </div>
                  )
                )}
              </>
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
