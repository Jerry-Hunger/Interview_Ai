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

  // Interview state
  const [interviewState, setInterviewState] = useState({
    currentQuestion: 1,
    totalQuestions: 5,
    timeRemaining: 1800, // 30 minutes
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

  // assuming you have set up axios baseURL in axios instance
  // example:
  // const api = axios.create({ baseURL: "http://localhost:5000/api" });

  const handleSetupSubmit = async () => {
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

    try {
      // Call backend with metadata
      const res = await axiosInstance.post("/interview/start", {
        role: setupData.role,
        resume: setupData.resume, // probably base64 or file id
        roundType: setupData.roundType,
        topic: setupData.topic,
        difficulty: setupData.difficulty,
      });

      // Response from backend (assuming it returns { question: "..." })
      const firstQuestion = res.data.message;

      // Move to interview screen
      setCurrentStep("interview");

      // Update interview state with question and chat history
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
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswerSubmit = async () => {
    if (!interviewState.answer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing",
        variant: "destructive",
      });
      return;
    }

    // Add current answer to chat history
    const updatedChatHistory = [
      ...interviewState.chatHistory,
      {
        type: "answer" as const,
        content: interviewState.answer,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    try {
      // ✅ Check if last question
      if (interviewState.currentQuestion >= interviewState.totalQuestions) {
        // 🎯 Interview conclude
        console.log(
          "Interview concluded. Fetching results..." +
            localStorage.getItem("token")
        );
        const res = await axiosInstance.post(
          "/interview/conclude",
          {
            history: updatedChatHistory,
            resumeText: setupData.resume,
            roleSummary: setupData.role,
            roundType: setupData.roundType,
            customTopic: setupData.topic,
            difficulty: setupData.difficulty,
            typeOfInterview: "practice", // or "company"
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Interview results:", res.data);
        const { interview } = res.data;

        // Go to results screen
        setInterviewResults(interview);
        setCurrentStep("results");

        // Optionally store results somewhere (context / state)
        // console.log("Interview Results:", { finalFeedback, result, feedbacks });
      } else {
        // 🎯 Normal flow → get next question
        const res = await axiosInstance.post("/interview/respond", {
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: setupData.resume,
          role: setupData.role,
          roundType: setupData.roundType,
          topic: setupData.topic,
          difficulty: setupData.difficulty,
        });

        const nextQuestion = res.data.message; // assume backend returns { message: "..." }

        // Append next question to history
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
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // const getScoreColor = (score: number) => {
  //   if (score >= 85) return "text-green-500 dark:text-green-400";
  //   if (score >= 70) return "text-yellow-500 dark:text-yellow-400";
  //   return "text-red-500 dark:text-red-400";
  // };

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
        {/* <Navigation /> */}
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
