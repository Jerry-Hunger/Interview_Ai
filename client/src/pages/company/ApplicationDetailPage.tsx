import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { useApplicationDetail, useUpdateApplicationStatus } from "@/hooks/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

// Markdown 渲染组件（支持 GFM 语法）
const markdownComponents = {
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    return isInline ? (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono" {...props}>{children}</code>
    ) : (
      <code className={`block p-4 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 text-sm font-mono overflow-x-auto ${className || ""}`} {...props}>{children}</code>
    );
  },
  h1: ({ children }: React.ComponentProps<"h1">) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{children}</h1>,
  h2: ({ children }: React.ComponentProps<"h2">) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h2>,
  h3: ({ children }: React.ComponentProps<"h3">) => <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h3>,
  p: ({ children }: React.ComponentProps<"p">) => <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: React.ComponentProps<"li">) => <li className="text-sm text-gray-700 dark:text-gray-300">{children}</li>,
  strong: ({ children }: React.ComponentProps<"strong">) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
  blockquote: ({ children }: React.ComponentProps<"blockquote">) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-2">{children}</blockquote>,
  table: ({ children }: React.ComponentProps<"table">) => <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-2">{children}</table>,
  th: ({ children }: React.ComponentProps<"th">) => <th className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-left text-xs font-semibold text-gray-700 dark:text-gray-200">{children}</th>,
  td: ({ children }: React.ComponentProps<"td">) => <td className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{children}</td>,
};

const ApplicationDetailPage: React.FC = () => {
  const { applicationId } = useParams<{
    applicationId: string;
  }>();
  const navigate = useNavigate();

  const { data: application, isPending, error, } = useApplicationDetail(applicationId!);
  const updateStatus = useUpdateApplicationStatus();
  const [showResume, setShowResume] = useState(false);

  const handleStatusUpdate = (newStatus: Application["status"]) => {
    if (!application) return;
    updateStatus.mutate(
      { id: (application as Application)._id, status: newStatus },
      {
        onError: () => {
          alert("更新状态失败");
        },
      }
    );
  };

  if (isPending) return (
    <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
  if (error) return <div className="p-6 text-red-500">获取申请详情失败</div>;
  if (!application) return <div className="p-6 text-gray-600 dark:text-gray-300">申请不存在</div>;

  const app = application as Application;
  const completedRounds = app.history?.length || 0;
  const totalRounds = app.jobId.rounds?.length || 0;

  const normalizeStatus = (status: string): Application["status"] => {
    if (status === "in-process") return "in-progress";
    return status as Application["status"];
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {h.feedback}
                      </ReactMarkdown>
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
                  disabled={updateStatus.isPending}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  批准 → 进入面试
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updateStatus.isPending}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  拒绝
                </Button>
              </>
            )}

            {normalizedStatus === "in-progress" && app.history && app.history.length > 0 && (
              <>
                {app.jobId.rounds && app.jobId.rounds.length > 1 && app.currentRound < app.jobId.rounds.length ? (
                  // 多轮面试：还有下一轮面试，等待企业开启下一轮
                  <Button
                    onClick={() => handleStatusUpdate("in-progress")}
                    disabled={updateStatus.isPending}
                    className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开启下一轮
                  </Button>
                ) : (
                  // 单轮面试 或 多轮面试已完成所有轮次，显示最终批准
                  <Button
                    onClick={() => handleStatusUpdate("final-selected")}
                    disabled={updateStatus.isPending}
                    className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:text-white dark:hover:bg-green-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    最终批准
                  </Button>
                )}
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={updateStatus.isPending}
                  className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  拒绝
                </Button>
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
