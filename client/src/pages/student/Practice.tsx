import React, { useEffect, useState, useRef, lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import { useStudentProfile, useResumeText } from "@/hooks/api";

const PracticeSetup = lazy(() => import("@/components/practice/PracticeSetup"));
const PracticeInterview = lazy(() => import("@/components/practice/PracticeInterview"));
const PracticeResults = lazy(() => import("@/components/practice/PracticeResults"));

type Step = "setup" | "interview" | "results";
type InterviewPhase = "answering" | "ended";

type SetupData = {
  resume: string;
  role: string;
  difficulty: string;
  roundType: string;
  topic: string;
  rounds: number;
  questionsPerRound: number;
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

type Interview = {
  _id: string;
  type: "practice" | "company";
  role: string;
  difficulty: string;
  roundType: string;
  rounds: number;
  currentRound?: number;
  result: "success" | "failure" | "Quit";
  feedback: string;
  transcript: { role: string; content: string }[];
  createdAt: string;
  finalFeedback?: string;
  chatHistory?: { type: string; content: string; timestamp: string }[];
  feedbacks?: string[];
};

const Practice = () => {
  const [currentStep, setCurrentStep] = useState<Step>("setup");
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
  const isMountedRef = useRef(true);

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

  const { data: userProfile } = useStudentProfile();
  const { data: resumeText } = useResumeText(userProfile?.resumeId);

  useEffect(() => {
    const state = location.state as {
      continueRound?: boolean;
      previousRoundIds?: string[];
      setupData?: SetupData;
      currentRound?: number;
      previousFeedback?: string;
    } | undefined;
    
    if (state?.setupData) {
      setSetupData(state.setupData);
    }
    
    if (state?.continueRound) {
      const effectiveSetupData = state.setupData;
      if (!effectiveSetupData) return;
      
      const nextRound = state.currentRound || currentRound + 1;
      setCurrentRound(nextRound);
      setInterviewPhase("answering");
      setIsStarting(true);

      axiosInstance.post("/interview/start", {
        role: effectiveSetupData.role,
        resume: effectiveSetupData.resume,
        roundType: effectiveSetupData.roundType,
        topic: effectiveSetupData.topic,
        difficulty: effectiveSetupData.difficulty,
        isContinuation: true,
        currentRound: nextRound,
        totalRounds: effectiveSetupData.rounds,
        previousFeedback: state.previousFeedback,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((res) => {
        const firstQuestion = res.data.message;
        setCurrentStep("interview");
        setInterviewState({
          currentQuestion: 1,
          totalQuestions: effectiveSetupData.questionsPerRound,
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
        toast({ title: "错误", description: "启动下一轮面试失败", variant: "destructive" });
      }).finally(() => {
        setIsStarting(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (resumeText && !setupData.resume) {
      setSetupData((prev) => ({ ...prev, resume: resumeText }));
    }
  }, [resumeText, setupData.resume]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      !setupData.resume
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
        roundType: setupData.roundType,
        topic: setupData.topic,
        difficulty: setupData.difficulty,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const firstQuestion = res.data.message;

      setIsStarting(false);
      setCurrentStep("interview");
      setInterviewPhase("answering");

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

  const isPerfunctoryReprompt = (text: string): boolean => {
    const rePromptPatterns = [
      /重新回答|请详细说明|请解释|请具体说明|请阐述|展开说说|说得更具体|详细一点|深入一点/i,
      /敷衍|过于简单|不够深入|不够具体|答非所问/i,
      /您的回答|你的回答.*问题|回答.*相关|涉及.*核心/i,
    ];
    return rePromptPatterns.some(pattern => pattern.test(text));
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

      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://interview-ai-backend-jpck.onrender.com/api"}/interview/respond-stream`, {
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

        setStreamingMessage("");
        setInterviewState((prev) => ({
          ...prev,
          chatHistory: updatedChatHistory,
          answer: "",
          question: finalResponse,
          ...(isReprompt || isLastQuestion ? {} : { currentQuestion: prev.currentQuestion + 1 }),
        }));

        if (isReprompt) {
          toast({
            title: "请完善您的回答",
            description: "您的回答需要更详细，请重新回答上一个问题",
            variant: "default",
          });
        } else if (isLastQuestion) {
          setInterviewPhase("ended");
        }
      }
    } catch (error: unknown) {
      console.error("Error in interview flow:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      toast({
        title: "错误",
        description: `出错了：${errorMessage}，请重试。`,
        variant: "destructive",
      });
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://interview-ai-backend-jpck.onrender.com/api"}/interview/conclude-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          history: interviewState.chatHistory,
          resumeText: effectiveSetupData.resume,
          roleSummary: effectiveSetupData.role,
          roundType: effectiveSetupData.roundType,
          customTopic: effectiveSetupData.topic,
          difficulty: effectiveSetupData.difficulty,
          typeOfInterview: "practice",
          currentRound: effectiveRounds > 1 ? currentRound : undefined,
          totalRounds: effectiveRounds > 1 ? effectiveRounds : undefined,
        }),
      });

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
        result: result as "success" | "failure" | "Quit",
        feedback: "",
        transcript: [],
        createdAt: new Date().toISOString(),
        finalFeedback,
        chatHistory: interviewState.chatHistory,
        feedbacks,
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
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(
        "/interview/conclude",
        {
          history: interviewState.chatHistory,
          resumeText: setupData.resume,
          roleSummary: setupData.role,
          roundType: setupData.roundType,
          customTopic: setupData.topic,
          difficulty: setupData.difficulty,
          typeOfInterview: "practice",
          result: "Quit",
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
      console.error("Error quitting interview:", error);
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
  if (currentStep === "results") {
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
        />
      </Suspense>
    </div>
  );
};

export default Practice;
