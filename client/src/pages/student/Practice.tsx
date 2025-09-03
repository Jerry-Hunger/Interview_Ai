import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import PracticeSetup from "@/components/practice/PracticeSetup";
import PracticeInterview from "@/components/practice/PracticeInterview";
import PracticeResults from "@/components/practice/PracticeResults";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

  // Interview state
  const [interviewState, setInterviewState] = useState({
    currentQuestion: 1,
    totalQuestions: 5,
    timeRemaining: 1800, // 30 minutes
    isRecording: false,
    isCameraOn: true,
    isMicOn: true,
    answer: "",
    questions: [
      "Tell me about yourself and your background in software development.",
      "Describe a challenging project you've worked on and how you overcame obstacles.",
      "How do you approach debugging when you encounter a difficult bug?",
      "Explain the difference between REST and GraphQL APIs.",
      "Where do you see yourself in 5 years?",
    ],
    chatHistory: [] as {
      type: "question" | "answer";
      content: string;
      timestamp: string;
    }[],
  });

  // Results state
  const [results] = useState({
    overallScore: 85,
    breakdown: {
      technical: 88,
      communication: 82,
      problemSolving: 87,
      confidence: 83,
    },
    strengths: [
      "Strong technical knowledge",
      "Clear communication style",
      "Good problem-solving approach",
    ],
    improvements: [
      "Provide more specific examples",
      "Speak with more confidence",
      "Better time management",
    ],
    detailedFeedback:
      "You demonstrated solid technical knowledge and problem-solving skills. Your explanations were clear and well-structured. To improve, consider providing more specific examples from your experience and speaking with greater confidence about your abilities.",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSetupSubmit = () => {
    console.log(setupData);
    if (
      !setupData.role ||
      !setupData.difficulty ||
      !setupData.roundType ||
      !setupData.resume
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep("interview");

    // Initialize chat with first question
    setInterviewState((prev) => ({
      ...prev,
      chatHistory: [
        {
          type: "question",
          content: prev.questions[0],
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));
  };

  const handleAnswerSubmit = () => {
    if (!interviewState.answer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing",
        variant: "destructive",
      });
      return;
    }

    const newChatHistory = [
      ...interviewState.chatHistory,
      {
        type: "answer" as const,
        content: interviewState.answer,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    if (interviewState.currentQuestion < interviewState.totalQuestions) {
      const nextQuestion =
        interviewState.questions[interviewState.currentQuestion];
      newChatHistory.push({
        type: "question",
        content: nextQuestion,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    setInterviewState((prev) => ({
      ...prev,
      chatHistory: newChatHistory,
      currentQuestion: prev.currentQuestion + 1,
      answer: "",
    }));

    if (interviewState.currentQuestion >= interviewState.totalQuestions) {
      setTimeout(() => setCurrentStep("results"), 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500 dark:text-green-400";
    if (score >= 70) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
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
          toast={toast}
        />
      </div>
    );
  }

  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <Navigation />
        <PracticeInterview
          setupData={setupData}
          interviewState={interviewState}
          setInterviewState={setInterviewState}
          handleAnswerSubmit={handleAnswerSubmit}
          formatTime={formatTime}
        />
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
