import { useEffect, useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import PracticeSetup from "@/components/practice/PracticeSetup";
import PracticeInterview from "@/components/practice/PracticeInterview";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import PracticeResults from "@/components/practice/PracticeResults";

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
    if (setupData.resume) return;
    
    const fetchUserResume = async () => {
      try {
        const res = await axiosInstance.get("/auth/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const userResumeText = res.data.user?.resumeText;
        if (userResumeText) {
          setSetupData((prev) => ({ ...prev, resume: userResumeText }));
        }
      } catch (err) {
        console.error("获取用户简历失败:", err);
      }
    };
    fetchUserResume();
  }, [setupData.resume]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
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
      setIsStarting(false);
      toast({
        title: "错误",
        description: "启动面试失败，请重试。",
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

      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://interview-ai-backend-jpck.onrender.com/api"}/interview/respond-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          ...(isLastQuestion ? {} : { currentQuestion: prev.currentQuestion + 1 }),
        }));

        if (isLastQuestion) {
          setInterviewPhase("ended");
        }
      }
    } catch (error: unknown) {
      console.error("Error in interview flow:", error);
      toast({
        title: "错误",
        description: "出错了，请重试。",
        variant: "destructive",
      });
    }
  };

  const handleEndInterview = async () => {
    setIsLoading(true);
    
    const navState = location.state as { setupData?: SetupData } | undefined;
    const effectiveSetupData = navState?.setupData || setupData;
    const effectiveRounds = effectiveSetupData.rounds;
    
    try {
      const res = await axiosInstance.post(
        "/interview/conclude",
        {
          history: interviewState.chatHistory,
          resumeText: effectiveSetupData.resume,
          roleSummary: effectiveSetupData.role,
          roundType: effectiveSetupData.roundType,
          customTopic: effectiveSetupData.topic,
          difficulty: effectiveSetupData.difficulty,
          typeOfInterview: "practice",
          currentRound: effectiveRounds > 1 ? currentRound : undefined,
          totalRounds: effectiveRounds > 1 ? effectiveRounds : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const { interview } = res.data;

      if (effectiveRounds > 1) {
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
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <Navigation />
        <PracticeSetup
          setupData={setupData}
          setSetupData={setSetupData}
          handleSetupSubmit={handleSetupSubmit}
          navigate={navigate}
          isStarting={isStarting}
        />
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
        <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
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
      </div>
    );
  }
  if (currentStep === "results") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <Navigation />
        <PracticeResults interview={interviewResults} navigate={navigate} setupData={setupData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <Navigation />
      <PracticeSetup
        setupData={setupData}
        setSetupData={setSetupData}
        handleSetupSubmit={handleSetupSubmit}
        navigate={navigate}
        toast={toast}
        isStarting={isStarting}
      />
    </div>
  );
};

export default Practice;
