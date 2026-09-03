import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import { fetchMyResumes, fetchResumeText } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import type { SetupData, InterviewState, Interview, InterviewPhase, PracticeStep, ResumeSummary } from "@/types";
import { isPerfunctoryReprompt, stripRepromptTag } from "@/utils/interview";

const PracticeSetup = lazy(() => import("@/components/practice/PracticeSetup"));
const PracticeInterview = lazy(() => import("@/components/practice/PracticeInterview"));
const PracticeResults = lazy(() => import("@/components/practice/PracticeResults"));

const Practice = () => {
  const [currentStep, setCurrentStep] = useState<PracticeStep>("setup");
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>("answering");
  const [setupData, setSetupData] = useState<SetupData>({
    resume: "",
    role: "",
    difficulty: "",
    roundType: "",
    topic: "",
    rounds: 1,
    questionsPerRound: 5,
  });
  const [interviewResults, setInterviewResults] = useState<Interview | null>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundInterviewIds, setRoundInterviewIds] = useState<string[]>([]);
  const hasTriggeredAutoEndRef = useRef(false);
  /** 退出面试防重复提交标记 */
  const isQuittingRef = useRef(false);

  const [interviewState, setInterviewState] = useState<InterviewState>({
    currentQuestion: 1,
    totalQuestions: setupData.questionsPerRound || 5,
    timeRemaining: 1800,
    isRecording: false,
    isCameraOn: true,
    isMicOn: false,
    answer: "",
    question: "",
    chatHistory: [],
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const { data: resumes } = useFetch(() => fetchMyResumes());
  const { data: resumeText } = useFetch(
    () => fetchResumeText(setupData.resumeId ?? ""),
    [setupData.resumeId],
    { enabled: !!setupData.resumeId }
  );

  useEffect(() => {
    const state = location.state as {
      continueRound?: boolean;
      previousRoundIds?: string[];
      setupData?: SetupData;
      currentRound?: number;
      previousFeedback?: string;
    } | undefined;

    // 计算每轮的问题数量（每轮固定为配置的问题数目）
    const getQuestionsForRound = (): number => {
      return setupData.questionsPerRound || 5;
    };
    
    if (state?.setupData) {
      setSetupData(state.setupData);
    }
    
    if (state?.continueRound) {
      const effectiveSetupData = state.setupData;
      if (!effectiveSetupData) return;
      
      const nextRound = state.currentRound || currentRound + 1;
      setCurrentRound(nextRound);
      setInterviewPhase("answering");
      hasTriggeredAutoEndRef.current = false;
      setIsStarting(true);

      axiosInstance.post("/interview/start", {
        role: effectiveSetupData.role,
        resume: effectiveSetupData.resume,
        resumeId: effectiveSetupData.resumeId,
        roundType: effectiveSetupData.roundType,
        topic: effectiveSetupData.topic,
        difficulty: effectiveSetupData.difficulty,
        type: "practice",
        isContinuation: true,
        currentRound: nextRound,
        totalRounds: effectiveSetupData.rounds,
        previousFeedback: state.previousFeedback,
        questionsPerRound: effectiveSetupData.questionsPerRound,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((res) => {
        const firstQuestion = res.data.message;
        setCurrentStep("interview");
        setInterviewState({
          currentQuestion: 1,
          totalQuestions: getQuestionsForRound(),
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
      }).catch((err) => {
        console.error("Error starting next round:", err);
        const errorMessage = err?.response?.data?.error || err?.message || "启动下一轮面试失败";
        toast({ title: "错误", description: errorMessage, variant: "destructive" });
      }).finally(() => {
        setIsStarting(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    const defaultResume = (resumes as ResumeSummary[] | null)?.find((resume) => resume.isDefault)
      || (resumes as ResumeSummary[] | null)?.[0];
    if (defaultResume && !setupData.resumeId) {
      setSetupData((prev) => ({ ...prev, resumeId: defaultResume._id }));
    }
  }, [resumes, setupData.resumeId]);

  useEffect(() => {
    if (resumeText) setSetupData((prev) => ({ ...prev, resume: resumeText }));
  }, [resumeText]);

  useEffect(() => {
    localStorage.removeItem("pendingNextRound");
  }, []);

  useEffect(() => {
    setInterviewState((prev) => ({
      ...prev,
      totalQuestions: setupData.questionsPerRound,
    }));
  }, [setupData.rounds, setupData.questionsPerRound]);

  const handleSetupSubmit = async () => {
    if (
      !setupData.role ||
      !setupData.difficulty ||
      !setupData.roundType ||
      !setupData.resume ||
      !setupData.resumeId
    ) {
      toast({
        title: "信息不完整",
        description: "请填写所有必填项以继续",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    setCurrentRound(1);
    setRoundInterviewIds([]);

    try {
      const res = await axiosInstance.post("/interview/start", {
        role: setupData.role,
        resume: setupData.resume,
        resumeId: setupData.resumeId,
        roundType: setupData.roundType,
        topic: setupData.topic,
        difficulty: setupData.difficulty,
        type: "practice",
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const firstQuestion = res.data.message;

      setIsStarting(false);
      setCurrentStep("interview");
      setInterviewPhase("answering");
      hasTriggeredAutoEndRef.current = false;

      setInterviewState({
        currentQuestion: 1,
        totalQuestions: setupData.questionsPerRound,
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
      console.error("Error starting interview:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setIsStarting(false);
      toast({
        title: "错误",
        description: `启动面试失败：${errorMessage}，请重试。`,
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

      const effectiveRounds = setupData?.rounds || 1;

      const response = await fetch("/api/interview/respond-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: setupData.resume,
          role: setupData.role,
          roundType: setupData.roundType,
          topic: setupData.topic,
          difficulty: setupData.difficulty,
          isLastQuestion,
          currentRound: effectiveRounds > 1 ? currentRound : undefined,
          totalRounds: effectiveRounds > 1 ? effectiveRounds : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("respond-stream error:", response.status, errorText);
        throw new Error(`服务器错误: ${response.status}`);
      }

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

        // 如果是 reprompt，清理标签后单独处理，避免重复推送
        if (isReprompt) {
          const cleanedResponse = stripRepromptTag(finalResponse);
          toast({
            title: "请完善您的回答",
            description: "您的回答需要更详细，请重新回答上一个问题",
            variant: "default",
          });
          setInterviewState((prev) => ({
            ...prev,
            chatHistory: [
              ...updatedChatHistory,
              {
                type: "question" as const,
                content: cleanedResponse,
                timestamp: new Date().toLocaleTimeString(),
              },
            ],
            answer: "",
            question: cleanedResponse,
            isReprompt: true,
            currentQuestion: prev.currentQuestion,
          }));
          return;
        }

        // 正常回复：推入原始 AI 回复
        updatedChatHistory.push({
          type: "question",
          content: finalResponse,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 最后一题已回答且非 reprompt → 面试结束
        // 服务端对最后一题使用 respondLastQuestion 提示词，AI 只会做总结或要求重答
        // 所以非 reprompt 就意味着面试应当结束
        if (isLastQuestion && !hasTriggeredAutoEndRef.current) {
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
        }

        // 非最后一题：检查 AI 是否提前结束（如说了"面试结束"之类的结束语）
        const endKeywords = /面试.*结束|到此结束|感谢.*参与|所有问题.*回答|面试.*告一段落/i;
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
        }

        // 正常继续下一题
        setInterviewState((prev) => ({
          ...prev,
          chatHistory: updatedChatHistory,
          answer: "",
          question: finalResponse,
          isReprompt: false,
          currentQuestion: isLastQuestion ? prev.currentQuestion : prev.currentQuestion + 1,
        }));
      }
    } catch (error: unknown) {
      console.error("Error in interview flow:", error);
      // 检查是否是429错误（请求过于频繁）
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

  const handleEndInterview = async () => {
    setIsLoading(true);

    const navState = location.state as { setupData?: SetupData } | undefined;
    const effectiveSetupData = navState?.setupData || setupData;
    const effectiveRounds = effectiveSetupData.rounds;

    if (!effectiveSetupData?.resume || !effectiveSetupData?.role) {
      console.error("handleEndInterview: missing setupData", { effectiveSetupData });
      setIsLoading(false);
      toast({ title: "错误", description: "面试配置数据不完整", variant: "destructive" });
      return;
    }

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
          resumeText: effectiveSetupData.resume,
          resumeId: effectiveSetupData.resumeId,
          roleSummary: effectiveSetupData.role,
          roundType: effectiveSetupData.roundType,
          customTopic: effectiveSetupData.topic,
          difficulty: effectiveSetupData.difficulty,
          typeOfInterview: "practice",
          currentRound: effectiveRounds > 1 ? currentRound : undefined,
          totalRounds: effectiveRounds > 1 ? effectiveRounds : undefined,
        }),
      });

      // 检查 HTTP 状态码
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
        type: "practice" as const,
        role: effectiveSetupData.role,
        difficulty: effectiveSetupData.difficulty,
        roundType: effectiveSetupData.roundType,
        rounds: effectiveRounds || 1,
        currentRound: effectiveRounds > 1 ? currentRound : undefined,
        result: result as "success" | "failure" | "quit",
        feedback: "",
        transcript: [],
        createdAt: new Date().toISOString(),
        finalFeedback,
        chatHistory: interviewState.chatHistory,
        feedbacks,
        resumeText: effectiveSetupData.resume,  // 保存简历文本以便后续轮次使用
      };

      setIsLoading(false);

      if (effectiveRounds > 1) {
        if (currentRound < effectiveRounds) {
          localStorage.setItem(
            "pendingNextRound",
            JSON.stringify({
              interviewId: interview._id,
              nextRound: currentRound + 1,
            })
          );
        }
        const newRoundIds = [...roundInterviewIds, interview._id];
        setInterviewResults(interview);
        navigate("/student/practice-result", {
          state: {
            interview,
            roundInterviewIds: newRoundIds,
            currentRound,
            totalRounds: effectiveRounds,
            rounds: effectiveRounds,
            setupData: effectiveSetupData,
          },
          replace: true
        });
      } else {
        setInterviewResults(interview);
        navigate("/student/practice-result", { state: { interview }, replace: true });
      }
    } catch (error: unknown) {
      console.error("Error ending interview:", error);
      toast({
        title: "错误",
        description: "生成反馈失败，请重试。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleQuit = async () => {
    // 防重复点击
    if (isQuittingRef.current || isLoading) return;
    isQuittingRef.current = true;
    setIsLoading(true);

    try {
      const res = await axiosInstance.post(
        "/interview/conclude",
        {
          history: interviewState.chatHistory,
          resumeText: setupData.resume,
          resumeId: setupData.resumeId,
          roleSummary: setupData.role,
          roundType: setupData.roundType,
          customTopic: setupData.topic,
          difficulty: setupData.difficulty,
          typeOfInterview: "practice",
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
      navigate("/student/practice-result", { state: { interview }, replace: true });
    } catch (error: unknown) {
      // 失败时重置，允许重试
      isQuittingRef.current = false;
      console.error("Error quitting interview:", error);
      // 检查是否是429错误（请求过于频繁）
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

  if (currentStep === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <Suspense fallback={<LoadingSpinner size="lg" text="加载中..." />}>
          <PracticeSetup
            setupData={setupData}
            setSetupData={setSetupData}
            resumes={(resumes || []) as ResumeSummary[]}
            handleSetupSubmit={handleSetupSubmit}
            navigate={navigate}
            isStarting={isStarting}
          />
        </Suspense>
      </div>
    );
  }

  if (currentStep === "interview") {
    const navState = location.state as {
      continueRound?: boolean;
      previousRoundIds?: string[];
      setupData?: SetupData;
      currentRound?: number;
      previousFeedback?: string;
    } | undefined;
    const effectiveSetupData = navState?.setupData || setupData;
    const effectiveCurrentRound = navState?.currentRound || currentRound;
    
    if (!effectiveSetupData || !effectiveSetupData.role) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
          <LoadingSpinner size="lg" text="加载中..." />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <Suspense fallback={<LoadingSpinner size="lg" text="加载中..." />}>
          <PracticeInterview
            setupData={effectiveSetupData}
            interviewState={interviewState}
            setInterviewState={setInterviewState}
            handleAnswerSubmit={handleAnswerSubmit}
            handleEndInterview={handleEndInterview}
            handleQuit={handleQuit}
            toast={toast}
            isLoading={isLoading}
            interviewPhase={interviewPhase}
            streamingMessage={streamingMessage}
            currentRound={effectiveCurrentRound}
          />
        </Suspense>
      </div>
    );
  }
  if (currentStep === "results" && interviewResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <Suspense fallback={<LoadingSpinner size="lg" text="加载中..." />}>
          <PracticeResults interview={interviewResults} navigate={navigate} setupData={setupData} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
      <Suspense fallback={<LoadingSpinner size="lg" text="加载中..." />}>
        <PracticeSetup
          setupData={setupData}
          setSetupData={setSetupData}
          handleSetupSubmit={handleSetupSubmit}
          navigate={navigate}
          isStarting={isStarting}
          resumes={(resumes || []) as ResumeSummary[]}
        />
      </Suspense>
    </div>
  );
};

export default Practice;
