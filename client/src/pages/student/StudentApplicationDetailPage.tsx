import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PracticeInterview from "@/components/practice/PracticeInterview";
import PracticeResults from "@/components/practice/PracticeResults";
import { useToast } from "@/hooks/use-toast";
import { useApplicationDetail } from "@/hooks/api";
import { Loader2, Hourglass, XCircle, CheckCircle, Trophy, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "waiting" | "interview" | "results";

type RoundHistory = {
  roundNumber: number;
  result: string;
  feedback?: string;
};

type ApplicationType = {
  _id: string;
  jobId: { title: string; description: string; difficulty: string; rounds: { type?: string; description?: string }[] };
  resumeId?: { _id: string; fileUrl: string; fileName: string; fileType: string };
  status: string;
  currentRound: number;
  history?: RoundHistory[];
};

type JobType = {
  title: string;
  description: string;
  difficulty: string;
  rounds: { type?: string; description?: string }[];
  company?: { name: string };
};

type ChatMessage = {
  type: "question" | "answer";
  content: string;
  timestamp: string;
};

type InterviewState = {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: number;
  isRecording: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  answer: string;
  question: string;
  chatHistory: ChatMessage[];
};

type InterviewResult = {
  _id: string;
  result: string;
  finalFeedback?: string;
};

const difficultyMap: Record<string, string> = {
  beginner: "初级（0-2年）",
  intermediate: "中级（2-5年）",
  senior: "高级（5年以上）",
};

const roundTypeMap: Record<string, string> = {
  behavioral: "行为面",
  technical: "技术面",
  hr: "HR面",
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: application, isPending } = useApplicationDetail(id!);
  const job = (application as ApplicationType)?.jobId as JobType | null;

  const [resumeText, setResumeText] = useState<string>("");

  const [currentStep, setCurrentStep] = useState<Step>("waiting");
  const [interviewState, setInterviewState] = useState<InterviewState>({
    currentQuestion: 1,
    totalQuestions: 5,
    timeRemaining: 1800,
    isRecording: false,
    isCameraOn: true,
    isMicOn: false,
    answer: "",
    question: "",
    chatHistory: [],
  });
  const [interviewResults, setInterviewResults] = useState<InterviewResult | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const handleStartInterview = async () => {
    try {
      let resumeToUse = resumeText;
      if (!resumeToUse && application.resumeId?._id) {
        const rtRes = await axiosInstance.get(`/resume/${application.resumeId._id}/text`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        resumeToUse = rtRes.data.text || "";
        setResumeText(resumeToUse);
      }

      if (!resumeToUse) {
        toast({
          title: "错误",
          description: "简历内容为空，请先上传简历",
          variant: "destructive",
        });
        return;
      }

      setIsStartingInterview(true);

      const res = await axiosInstance.post("/interview/start", {
        role: job?.title,
        resume: resumeToUse,
        roundType: job?.rounds[application.currentRound]?.type || "综合面试",
        topic: job?.rounds[application.currentRound]?.description || "",
        difficulty: job?.difficulty,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const firstQuestion = res.data.message;

      setInterviewState((prev: InterviewState) => ({
        ...prev,
        question: firstQuestion,
        chatHistory: [
          {
            type: "question",
            content: firstQuestion,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));

      setIsStartingInterview(false);
      setCurrentStep("interview");
      } catch (error: unknown) {
      setIsStartingInterview(false);
      console.error("Error starting interview:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      toast({
        title: "错误",
        description: `启动面试失败：${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleAnswerSubmit = async () => {
    if (!interviewState.answer.trim()) {
      toast({
        title: "请输入回答",
        description: "请在继续之前提供回答",
        variant: "destructive",
      });
      return;
    }

    const updatedChatHistory = [
      ...interviewState.chatHistory,
      {
        type: "answer" as const,
        content: interviewState.answer,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    try {
      if (interviewState.currentQuestion >= interviewState.totalQuestions) {
        const res = await axiosInstance.post(
          "/interview/conclude",
          {
            history: updatedChatHistory,
            resumeText: resumeText,
            roleSummary: job?.title,
            roundType: job?.rounds[application.currentRound]?.type,
            customTopic: job?.rounds[application.currentRound]?.description,
            difficulty: job?.difficulty,
            typeOfInterview: "company",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const { interview } = res.data;

        await axiosInstance.post(
          `/applications/${application._id}/round`,
          {
            roundNumber: application.currentRound + 1,
            interviewId: interview._id,
            result: interview.result,
            feedback: interview.finalFeedback || "",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setInterviewResults(interview);
        setCurrentStep("results");
      } else {
        const res = await axiosInstance.post("/interview/respond", {
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: resumeText,
          role: job?.title,
          roundType: job?.rounds[application.currentRound]?.type,
          topic: job?.rounds[application.currentRound]?.description,
          difficulty: job?.difficulty,
        });

        const nextQuestion = res.data.message;

        updatedChatHistory.push({
          type: "question",
          content: nextQuestion,
          timestamp: new Date().toLocaleTimeString(),
        });

        setInterviewState((prev: InterviewState) => ({
          ...prev,
          chatHistory: updatedChatHistory,
          currentQuestion: prev.currentQuestion + 1,
          question: nextQuestion,
          answer: "",
        }));
      }
    } catch {
      console.error("Error in interview flow");
      toast({
        title: "错误",
        description: "面试过程中出错了",
        variant: "destructive",
      });
    }
  };

  if (isPending || !application || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  if (currentStep === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
        <div className="max-w-3xl mx-auto py-12 px-6 space-y-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4 text-indigo-500 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
          >
            返回
          </Button>
          {/* 职位信息卡片 */}
          <div className="rounded-2xl bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{job.title?.charAt(0) || "岗"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {job.title}
                </h1>
                {job.company && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {job.company.name}
                  </p>
                )}
              </div>
            </div>

            {/* 职位描述 - 优化展示 */}
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">职位描述</span>
              </div>
              <div className="pl-3 space-y-2">
                {job.description?.split('\n').filter(Boolean).map((para, idx) => (
                  <p key={idx} className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    {para}
                  </p>
                )) || (
                  <p className="text-slate-500 dark:text-slate-400 italic">暂无职位描述</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {job.rounds && job.rounds.length > 0 && (
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  难度：{job.rounds.map((r, i) => difficultyMap[r.difficulty] || r.difficulty).join(" → ")}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                共 {job.rounds?.length || 0} 轮面试
              </span>
            </div>
          </div>

          {/* 申请状态卡片 */}
          <div className="rounded-2xl bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              申请状态
            </h2>
            {application.status === "applied" && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <Hourglass className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">等待企业审核</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">请耐心等待，企业正在处理您的申请</p>
                </div>
              </div>
            )}
            {application.status === "rejected" && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">很遗憾，您的申请已被拒绝</p>
                  <p className="text-sm text-red-600 dark:text-red-400">可以尝试申请其他职位</p>
                </div>
              </div>
            )}
            {application.status === "selected" && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                <Trophy className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">您已通过！</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">等待最终审核结果</p>
                </div>
              </div>
            )}
            {application.status === "final-selected" && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <Trophy className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">恭喜！您已最终通过</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">期待您的新工作</p>
                </div>
              </div>
            )}
            {application.status === "in-progress" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                  <Clock className="w-6 h-6 text-indigo-500" />
                  <div>
                    <p className="font-medium text-indigo-700 dark:text-indigo-300">
                      当前进度：第 {application.currentRound + 1} 轮 / 共 {job.rounds?.length || 0} 轮
                    </p>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                      下一轮：{roundTypeMap[job.rounds[application.currentRound]?.type] || job.rounds[application.currentRound]?.type || "综合面试"}
                    </p>
                  </div>
                </div>
                {/* 面试进度可视化 */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {job.rounds?.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        idx < application.currentRound
                          ? "bg-emerald-500 text-white"
                          : idx === application.currentRound
                          ? "bg-indigo-500 text-white ring-4 ring-indigo-200 dark:ring-indigo-800"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}>
                        {idx < application.currentRound ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      {idx < (job.rounds?.length || 0) - 1 && (
                        <div className={`w-8 h-1 rounded ${
                          idx < application.currentRound
                            ? "bg-emerald-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleStartInterview}
                  disabled={isStartingInterview}
                  className="w-full mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 dark:from-indigo-600 dark:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isStartingInterview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      准备面试中...
                    </>
                  ) : (
                    <>开始第 {application.currentRound + 1} 轮面试</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 已完成面试历史 */}
          {application.history && application.history.length > 0 && (
            <div className="rounded-2xl bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                已完成的面试
              </h2>
              <ul className="space-y-4">
                {application.history?.map((round: RoundHistory, idx: number) => (
                  <li
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-[#23263A] dark:to-[#1C1E2C]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        第 {round.roundNumber} 轮：{roundTypeMap[job.rounds[round.roundNumber - 1]?.type] || job.rounds[round.roundNumber - 1]?.type || "未知"}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                        round.result === "success"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {round.result === "success" ? <><Check className="w-3.5 h-3.5" />通过</> : <><X className="w-3.5 h-3.5" />未通过</>}
                      </span>
                    </div>
                    {round.feedback && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        反馈：{round.feedback}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 即将到来的面试 */}
          {application.status === "in-progress" &&
            job.rounds &&
            application.currentRound < job.rounds.length && (
              <div className="rounded-2xl bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  即将到来的面试
                </h2>
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    第 {application.currentRound + 1} 轮：{roundTypeMap[job.rounds[application.currentRound]?.type] || job.rounds[application.currentRound]?.type}
                  </p>
                  {job.rounds[application.currentRound]?.description && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {job.rounds[application.currentRound]?.description}
                    </p>
                  )}
                </div>
              </div>
            )}

          {interviewResults && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#1a1c29] rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
                  面试结果
                </h3>
                <PracticeResults
                  interview={interviewResults}
                  navigate={() => setInterviewResults(null)}
                />
                <button
                  onClick={() => setInterviewResults(null)}
                  className="cursor-pointer mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
        <PracticeInterview
          setupData={{
            role: job?.title,
            resume: resumeText,
            roundType: job?.rounds[application.currentRound]?.type,
            topic: job?.rounds[application.currentRound]?.description,
            difficulty: job?.difficulty,
          }}
          interviewState={interviewState}
          setInterviewState={setInterviewState}
          handleAnswerSubmit={handleAnswerSubmit}
          formatTime={(s: number) =>
            `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
          }
          toast={toast}
        />
      </div>
    );
  }

  if (currentStep === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
        <PracticeResults interview={interviewResults} navigate={() => {}} />
      </div>
    );
  }

  return null;
};

export default ApplicationDetail;
