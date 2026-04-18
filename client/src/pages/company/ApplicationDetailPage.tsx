import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import ResumeViewer from "@/components/resume/ResumeViewer";

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

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/applications/${applicationId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setApplication(res.data);
      } catch (err) {
        console.error("获取申请详情失败", err);
      } finally {
        setLoading(false);
      }
    };
    if (applicationId) fetchApp();
  }, [applicationId]);

  const updateStatus = async (newStatus: Application["status"]) => {
    if (!application) return;
    setUpdating(true);
    try {
      await axiosInstance.patch(
        `/applications/${application._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setApplication({ ...application, status: newStatus });
    } catch (err) {
      console.error("更新状态失败", err);
      alert("更新状态失败");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">加载中...</div>;
  if (!application) return <div className="p-6 text-gray-600 dark:text-gray-300">申请不存在</div>;

  const completedRounds = application.history?.length || 0;
  const totalRounds = application.jobId.rounds?.length || 0;

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Card className="rounded-2xl shadow-lg bg-white dark:bg-[#181c2f]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                {application.candidateId?.fullName} - {application.jobId?.title}
              </CardTitle>
              <Badge
                variant={
                  application.status === "final-selected"
                    ? "secondary"
                    : application.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {statusLabels[application.status] || application.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              邮箱：{application.candidateId?.email}
            </p>

            <div className="flex gap-2">
              <Button onClick={() => setShowResume(true)} variant="outline">
                查看简历
              </Button>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">面试进度</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                已完成 {completedRounds} / {totalRounds} 轮面试
              </p>
              <div className="mt-3 space-y-2">
                {application.history?.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-[#23263A]"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">
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
              <Button onClick={() => navigate(-1)} variant="outline">
                返回
              </Button>

              {application.status === "applied" && (
                <>
                  <Button
                    onClick={() => updateStatus("in-progress")}
                    disabled={updating}
                  >
                    批准 → 进入面试
                  </Button>
                  <Button
                    onClick={() => updateStatus("rejected")}
                    variant="destructive"
                    disabled={updating}
                  >
                    拒绝
                  </Button>
                </>
              )}

              {application.status === "selected" && (
                <Button
                  onClick={() => updateStatus("final-selected")}
                  disabled={updating}
                >
                  最终批准
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showResume && (
        <ResumeViewer
          resumeId={application.resumeId?._id}
          onClose={() => setShowResume(false)}
        />
      )}
    </>
  );
};

export default ApplicationDetailPage;
