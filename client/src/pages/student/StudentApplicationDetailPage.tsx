import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PracticeInterview from "@/components/practice/PracticeInterview";
import PracticeResults from "@/components/practice/PracticeResults";
import { useToast } from "@/hooks/use-toast";
import { useFetch } from "@/hooks/useFetch";
import { fetchApplicationDetail } from "@/services/api";
import { difficultyConfig } from "@/constants/difficulty";
import type { ApplicationDetail, ApplicationHistoryEntry, InterviewState, Interview, InterviewPhase } from "@/types";
import { roundTypeConfig } from "@/constants/roundType";
import { isPerfunctoryReprompt, stripRepromptTag } from "@/utils/interview";
import { Loader2, Hourglass, XCircle, Trophy, Clock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

type Step = "waiting" | "interview" | "results";

/** 获取难度标签文本 */
const getDifficultyLabel = (key: string): string => {
  const config = difficultyConfig[key as keyof typeof difficultyConfig];
  return config ? config.label : key;
};


const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: application, loading: isPending, refetch: refetchApplication } = useFetch<ApplicationDetail>(
    () => fetchApplicationDetail(id!),
    [id],
    { enabled: !!id }
  );

  const job = application?.jobId ?? null;

  const [resumeText, setResumeText] = useState<string>("");

  const [currentStep, setCurrentStep] = useState<Step>("waiting");
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>("answering");
  const [streamingMessage, setStreamingMessage] = useState("");
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
  const [interviewResults, setInterviewResults] = useState<Interview | null>(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasTriggeredAutoEndRef = useRef(false);

  const handleStartInterview = async () => {
    try {
      let resumeToUse = resumeText;
      if (!resumeToUse && application?.resumeId?._id) {
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

      // 判断是否为续轮面试（第二轮及以后）
      const isContinuation = application!.currentRound > 0;
      // 获取上一轮的反馈内容
      const previousFeedback = isContinuation && application!.history && application!.history.length > 0
        ? application!.history[application!.history.length - 1].feedback
        : "";

      const res = await axiosInstance.post("/interview/start", {
        role: job?.title,
        resume: resumeToUse,
        resumeId: application!.resumeId?._id,
        applicationId: application!._id,
        roundType: job?.rounds[application!.currentRound]?.type || "behavioral",
        topic: job?.rounds[application!.currentRound]?.topic || "",
        difficulty: job?.rounds[application!.currentRound]?.difficulty || "beginner",
        type: "company",
        isContinuation,
        currentRound: application!.currentRound + 1,
        totalRounds: job?.rounds?.length || 1,
        previousFeedback,
        questionsPerRound: 5,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const firstQuestion = res.data.message;

      setIsStartingInterview(false);
      setCurrentStep("interview");
      setInterviewPhase("answering");
      hasTriggeredAutoEndRef.current = false;

      setInterviewState({
        currentQuestion: 1,
        totalQuestions: 5,
        timeRemaining: 1800,
        isRecording: false,
        isCameraOn: true,
        isMicOn: false,
        answer: "",
        question: firstQuestion,
        chatHistory: [
          {
            type: "question",
            content: firstQuestion,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      });
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
      const isLastQuestion = interviewState.currentQuestion >= interviewState.totalQuestions;
      setStreamingMessage("");
      const fullResponse: string[] = [];

      const response = await fetch("/api/interview/respond-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: resumeText,
          role: job?.title,
          roundType: job?.rounds[application!.currentRound]?.type,
          topic: job?.rounds[application!.currentRound]?.topic,
          difficulty: job?.rounds[application!.currentRound]?.difficulty || job?.difficulty,
          isLastQuestion,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        setIsLoading(true);
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            fullResponse.push(chunk);
            setStreamingMessage(fullResponse.join(""));
          }
        }
        setIsLoading(false);

        const finalResponse = fullResponse.join("").trim();
        const isReprompt = isPerfunctoryReprompt(finalResponse);

        updatedChatHistory.push({
          type: "question",
          content: finalResponse,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (isReprompt) {
          toast({
            title: "请完善您的回答",
            description: "您的回答需要更详细，请重新回答上一个问题",
            variant: "default",
          });
          // 移除 [REPROMPT] 标签后保存
          const cleanedResponse = stripRepromptTag(finalResponse);
          const cleanedChatHistory = updatedChatHistory.map((msg, idx) =>
            idx === updatedChatHistory.length - 1 ? { ...msg, content: cleanedResponse } : msg
          );
          setInterviewState((prev) => ({
            ...prev,
            chatHistory: cleanedChatHistory,
            answer: "",
            question: cleanedResponse,
            isReprompt: true,
            currentQuestion: prev.currentQuestion,
          }));
          return;
        }

        const endKeywords = /本轮.*结束|面试到此结束|感谢.*参与|所有问题.*回答完毕/i;
        if (endKeywords.test(finalResponse) && !hasTriggeredAutoEndRef.current) {
          hasTriggeredAutoEndRef.current = true;
          setInterviewPhase("ended");
          setInterviewState((prev) => ({
            ...prev,
            chatHistory: updatedChatHistory,
            answer: "",
            question: finalResponse,
            isReprompt: false,
          }));
          return;
        } else {
          setInterviewState((prev) => ({
            ...prev,
            chatHistory: updatedChatHistory,
            answer: "",
            question: finalResponse,
            isReprompt: false,
            currentQuestion: isLastQuestion ? prev.currentQuestion : prev.currentQuestion + 1,
          }));
        }
      }
    } catch (error: unknown) {
      console.error("Error in interview flow:", error);
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429) {
        toast({
          title: "AI 忙碌中",
          description: "AI 面试官需要休息一下，请稍后再试。",
          variant: "destructive",
        });
      } else if (error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 429) {
        toast({
          title: "AI 忙碌中",
          description: "AI 面试官需要休息一下，请稍后再试。",
          variant: "destructive",
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        toast({
          title: "错误",
          description: `出错了：${errorMessage}，请重试。`,
          variant: "destructive",
        });
      }
    }
  };

  const handleQuit = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(
        "/interview/conclude",
        {
          history: interviewState.chatHistory,
          resumeText: resumeText,
          resumeId: application!.resumeId?._id,
          applicationId: application!._id,
          roleSummary: job?.title,
          roundType: job?.rounds[application!.currentRound]?.type || "behavioral",
          customTopic: job?.rounds[application!.currentRound]?.topic || "",
          difficulty: job?.rounds[application!.currentRound]?.difficulty || "intermediate",
          typeOfInterview: "company",
          currentRound: application!.currentRound + 1,
          totalRounds: job?.rounds?.length || 1,
          result: "quit",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const { interview } = res.data;

      setInterviewResults(interview);
      // 重新获取最新申请数据
      await refetchApplication();
      setCurrentStep("results");
    } catch (error: unknown) {
      console.error("Error quitting interview:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 429) {
          setIsLoading(false);
          toast({
            title: "AI 忙碌中",
            description: "服务器繁忙，请稍后再试。",
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: "错误",
        description: "退出面试失败，请重试。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    setIsLoading(true);

    // 调试：检查数据是否正确
    console.log("handleEndInterview - job:", job);
    console.log("handleEndInterview - application:", application);
    console.log("job?.difficulty:", job?.difficulty);
    console.log("job?.rounds:", job?.rounds);
    console.log("application.currentRound:", application?.currentRound);
    console.log("round info:", job?.rounds?.[application?.currentRound || 0]);

    const feedbacks: string[] = [];
    let finalFeedback = "";
    let interviewId = "";
    let result = "";
    let currentChunkIndex = -1;
    let phase: "idle" | "chunk" | "final" = "idle";
    let buffer = "";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/conclude-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          history: interviewState.chatHistory,
          resumeText: resumeText,
          resumeId: application!.resumeId?._id,
          applicationId: application!._id,
          roleSummary: job?.title,
          roundType: job?.rounds[application!.currentRound]?.type || "behavioral",
          customTopic: job?.rounds[application!.currentRound]?.topic || "",
          difficulty: job?.rounds[application!.currentRound]?.difficulty || "intermediate",
          typeOfInterview: "company",
          currentRound: application!.currentRound + 1,
          totalRounds: job?.rounds?.length || 1,
          result: "success",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setIsLoading(false);
          toast({
            title: "AI 忙碌中",
            description: "AI 面试官需要休息一下，请稍后再试。",
            variant: "destructive",
          });
          return;
        }
        throw new Error(`服务器错误: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (phase === "idle") {
            if (trimmedLine.startsWith("[CHUNK_START:")) {
              const match = trimmedLine.match(/\[CHUNK_START:(\d+)\]/);
              if (match) {
                currentChunkIndex = parseInt(match[1], 10);
                feedbacks[currentChunkIndex] = "";
                phase = "chunk";
                setStreamingMessage(`正在生成第 ${currentChunkIndex + 1} 部分反馈...`);
              }
            } else if (trimmedLine === "[FINAL_START]") {
              phase = "final";
              setStreamingMessage("正在生成最终评估...");
            }
          } else if (phase === "chunk") {
            if (trimmedLine.startsWith("[CHUNK_END:")) {
              phase = "idle";
            } else {
              if (!feedbacks[currentChunkIndex]) feedbacks[currentChunkIndex] = "";
              feedbacks[currentChunkIndex] += trimmedLine + "\n";
            }
          } else if (phase === "final") {
            if (trimmedLine.startsWith("[DONE:")) {
              const match = trimmedLine.match(/\[DONE:([^:]+):([^\]]+)\]/);
              if (match) {
                interviewId = match[1];
                result = match[2];
              }
            } else if (!trimmedLine.startsWith("[")) {
              finalFeedback += trimmedLine + "\n";
            }
          }
        }
      }

      if (buffer.trim() && phase === "final" && !buffer.trim().startsWith("[")) {
        finalFeedback += buffer.trim() + "\n";
      }

      if (!interviewId) {
        throw new Error("生成反馈失败：未收到面试ID");
      }

      finalFeedback = finalFeedback.trim();

      const interview = {
        _id: interviewId,
        type: "company" as const,
        role: job?.title || "",
        difficulty: job?.rounds[application!.currentRound]?.difficulty || job?.difficulty || "",
        roundType: job?.rounds[application!.currentRound]?.type || "",
        rounds: job?.rounds?.length || 1,
        currentRound: application!.currentRound + 1,
        result: result as "success" | "failure" | "quit",
        feedback: "",
        transcript: [],
        createdAt: new Date().toISOString(),
        finalFeedback,
        chatHistory: interviewState.chatHistory,
        feedbacks,
      };

      setIsLoading(false);

      await axiosInstance.post(
        `/applications/${application!._id}/round`,
        {
          roundNumber: application!.currentRound + 1,
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

      // 重新从服务器获取最新申请数据，确保缓存一致性
      await refetchApplication();

      setInterviewResults(interview);
      setCurrentStep("results");
    } catch (error: unknown) {
      setIsLoading(false);
      console.error("Error ending interview:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      toast({
        title: "错误",
        description: `生成反馈失败：${errorMessage}`,
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
                  难度：{job.rounds.map((r) => getDifficultyLabel(r.difficulty || job.difficulty || "beginner")).join(" → ")}
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
                {/* 检查是否有面试失败的历史记录 */}
                {application.history && application.history.some((h: ApplicationHistoryEntry) => h.result === "failure") ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                    <XCircle className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-300">面试未通过</p>
                      <p className="text-sm text-red-600 dark:text-red-400">您已无法继续此职位的面试流程</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                    <Clock className="w-6 h-6 text-indigo-500" />
                    <div>
                      <p className="font-medium text-indigo-700 dark:text-indigo-300">
                        当前进度：第 {application.currentRound + 1} 轮 / 共 {job.rounds?.length || 0} 轮
                      </p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        下一轮：{roundTypeConfig[job.rounds[application.currentRound]?.type || '']?.label || job.rounds[application.currentRound]?.type || "综合面试"}
                      </p>
                    </div>
                  </div>
                )}
                {/* 面试进度可视化 - 优化版 */}
                <div className="flex items-start justify-start gap-0 py-4">
                  {job.rounds?.map((_: unknown, idx: number) => {
                    const isCompleted = idx < application.currentRound;
                    const isActive = idx === application.currentRound;

                    return (
                      <div key={idx} className="flex items-center">
                        {/* 步骤节点 */}
                        <div className="relative flex flex-col items-center">
                          {/* 光晕效果 - 仅当前步骤显示 */}
                          {isActive && (
                            <div className="absolute inset-0 bg-indigo-400 rounded-full blur-md opacity-40" />
                          )}
                          {/* 主节点 */}
                          <div className={`relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                              : isActive
                              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                          }`}>
                            {isCompleted ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          {/* 步骤标签 */}
                          <span className={`absolute -bottom-6 text-xs whitespace-nowrap ${
                            isActive
                              ? "text-indigo-600 dark:text-indigo-400 font-medium"
                              : "text-slate-400 dark:text-slate-500"
                          }`}>
                            第{idx + 1}轮
                          </span>
                        </div>
                        {/* 连接线 */}
                        {idx < (job.rounds?.length || 0) - 1 && (
                          <div className={`w-12 h-1.5 mx-1 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-500"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* 如果有失败历史或企业尚未开启下一轮则不显示开始面试按钮 */}
                {!application.history?.some((h: ApplicationHistoryEntry) => h.result === "failure") && application.currentRound < (application.approvedThrough || 0) && (
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
                )}
                {/* 企业尚未开启下一轮时显示提示 */}
                {!application.history?.some((h: ApplicationHistoryEntry) => h.result === "failure") && application.currentRound >= (application.approvedThrough || 0) && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 mt-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      等待企业开启第 {application.currentRound + 1} 轮面试
                    </span>
                  </div>
                )}
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
                {application.history?.map((round: ApplicationHistoryEntry, idx: number) => (
                  <li
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-[#23263A] dark:to-[#1C1E2C]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        第 {round.roundNumber} 轮：{roundTypeConfig[job.rounds[round.roundNumber - 1]?.type || '']?.label || job.rounds[round.roundNumber - 1]?.type || "未知"}
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
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <span className="font-medium">反馈：</span>
                        <div className="prose prose-sm dark:prose-invert max-w-none mt-1">
                          <MarkdownRenderer content={round.feedback || ""} />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 即将到来的面试 - 只有在有失败历史时不显示 */}
          {application.status === "in-progress" &&
            job.rounds &&
            application.currentRound < job.rounds.length &&
            !application.history?.some((h) => h.result === "failure") && (
              <div className="rounded-2xl bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  即将到来的面试
                </h2>
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    第 {application.currentRound + 1} 轮：{roundTypeConfig[job.rounds[application.currentRound]?.type || '']?.label || job.rounds[application.currentRound]?.type}
                  </p>
                  {job.rounds[application.currentRound]?.topic && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {job.rounds[application.currentRound]?.topic}
                    </p>
                  )}
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
            role: job?.title || "",
            resume: resumeText,
            roundType: job?.rounds[application.currentRound]?.type || "",
            topic: job?.rounds[application.currentRound]?.topic || "",
            difficulty: job?.rounds[application.currentRound]?.difficulty || job?.difficulty || "",
            rounds: job?.rounds?.length || 1,
            questionsPerRound: 5,
          }}
          interviewState={interviewState}
          setInterviewState={setInterviewState}
          handleAnswerSubmit={handleAnswerSubmit}
          handleEndInterview={handleEndInterview}
          handleQuit={handleQuit}
          toast={toast}
          isLoading={isLoading}
          interviewPhase={interviewPhase}
          streamingMessage={streamingMessage}
          currentRound={application.currentRound + 1}
        />
      </div>
    );
  }

  if (currentStep === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
        <PracticeResults
          interview={interviewResults!}
          navigate={(path: string) => {
            navigate(path);
          }}
          setupData={{
            role: job?.title || "",
            resume: resumeText,
            difficulty: job?.rounds[application.currentRound]?.difficulty || job?.difficulty || "",
            roundType: job?.rounds[application.currentRound]?.type || "",
            topic: job?.rounds[application.currentRound]?.topic || "",
            rounds: job?.rounds?.length || 1,
            questionsPerRound: 5,
          }}
          rounds={job?.rounds?.length}
        />
      </div>
    );
  }

  return null;
};

export default ApplicationDetail;
