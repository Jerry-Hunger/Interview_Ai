import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PracticeSetup from "@/components/practice/PracticeSetup";
import PracticeInterview from "@/components/practice/PracticeInterview";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import PracticeResults from "@/components/practice/PracticeResults";

type Step = "setup" | "interview" | "results";

const Practice = () => {
  const [currentStep, setCurrentStep] = useState<Step>("setup");
  const [setupData, setSetupData] = useState({
    resume: "",
    role: "",
    difficulty: "",
    roundType: "",
    topic: "",
  });
  const [interviewResults, setInterviewResults] = useState({});

  const [interviewState, setInterviewState] = useState({
    currentQuestion: 1,
    totalQuestions: 5,
    timeRemaining: 1800,
    isRecording: false,
    isCameraOn: true,
    isMicOn: false,
    answer: "",
    question: "",
    chatHistory: [] as {
      type: "question" | "answer";
      content: string;
      timestamp: string;
    }[],
  });

  const navigate = useNavigate();
  const { toast } = useToast();

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

    try {
      const res = await axiosInstance.post("/interview/start", {
        role: setupData.role,
        resume: setupData.resume,
        roundType: setupData.roundType,
        topic: setupData.topic,
        difficulty: setupData.difficulty,
      });

      const firstQuestion = res.data.message;

      setCurrentStep("interview");

      setInterviewState((prev) => ({
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
    } catch (error: any) {
      console.error("Error starting interview:", error);
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
      if (interviewState.currentQuestion >= interviewState.totalQuestions) {
        const res = await axiosInstance.post(
          "/interview/conclude",
          {
            history: updatedChatHistory,
            resumeText: setupData.resume,
            roleSummary: setupData.role,
            roundType: setupData.roundType,
            customTopic: setupData.topic,
            difficulty: setupData.difficulty,
            typeOfInterview: "practice",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const { interview } = res.data;

        setInterviewResults(interview);
        setCurrentStep("results");
      } else {
        const res = await axiosInstance.post("/interview/respond", {
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: setupData.resume,
          role: setupData.role,
          roundType: setupData.roundType,
          topic: setupData.topic,
          difficulty: setupData.difficulty,
        });

        const nextQuestion = res.data.message;

        updatedChatHistory.push({
          type: "question",
          content: nextQuestion,
          timestamp: new Date().toLocaleTimeString(),
        });

        setInterviewState((prev) => ({
          ...prev,
          chatHistory: updatedChatHistory,
          currentQuestion: prev.currentQuestion + 1,
          question: nextQuestion,
          answer: "",
        }));
      }
    } catch (error: any) {
      console.error("Error in interview flow:", error);
      toast({
        title: "错误",
        description: "出错了，请重试。",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
        />
      </div>
    );
  }

  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <PracticeInterview
          setupData={setupData}
          interviewState={interviewState}
          setInterviewState={setInterviewState}
          handleAnswerSubmit={handleAnswerSubmit}
          formatTime={formatTime}
          toast={toast}
        />
      </div>
    );
  }
  if (currentStep === "results") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <Navigation />
        <PracticeResults interview={interviewResults} navigate={navigate} />
      </div>
    );
  }

  useEffect(() => {
    console.log(setupData);
  }, [setupData]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <Navigation />
      <PracticeSetup
        setupData={setupData}
        setSetupData={setSetupData}
        handleSetupSubmit={handleSetupSubmit}
        navigate={navigate}
        toast={toast}
      />
    </div>
  );
};

export default Practice;
