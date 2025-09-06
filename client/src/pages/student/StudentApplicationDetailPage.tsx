import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import PracticeInterview from "@/components/practice/PracticeInterview";
import PracticeResults from "@/components/practice/PracticeResults";
import { useToast } from "@/hooks/use-toast";

type Step = "waiting" | "interview" | "results";

const ApplicationDetail = () => {
  const { id } = useParams(); // applicationId
  const { toast } = useToast();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState<Step>("waiting");
  const [interviewState, setInterviewState] = useState<any>({
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
  const [interviewResults, setInterviewResults] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/applications/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setApplication(res.data);
        // fetch job separately if only ID is returned
        setJob(res.data.jobId);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load application",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [id]);

  const handleStartInterview = async () => {
    try {
      const res = await axiosInstance.post("/interview/start", {
        role: job.title,
        resume: application.resumeText,
        roundType: job.rounds[application.currentRound]?.type || "General",
        topic: job.rounds[application.currentRound]?.description || "",
        difficulty: job.difficulty,
      });

      const firstQuestion = res.data.message;

      setInterviewState((prev: any) => ({
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

      setCurrentStep("interview");
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start interview",
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

    // Add answer to history
    const updatedChatHistory = [
      ...interviewState.chatHistory,
      {
        type: "answer" as const,
        content: interviewState.answer,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    try {
      // ✅ Check if this was the last question
      if (interviewState.currentQuestion >= interviewState.totalQuestions) {
        // 🎯 Interview concludes
        const res = await axiosInstance.post(
          "/interview/conclude",
          {
            history: updatedChatHistory,
            resumeText: application.resumeText,
            roleSummary: job.title,
            roundType: job.rounds[application.currentRound]?.type,
            customTopic: job.rounds[application.currentRound]?.description,
            difficulty: job.difficulty,
            typeOfInterview: "company",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const { interview } = res.data;

        // 🟢 Save round result to application
        await axiosInstance.post(
          `/applications/${application._id}/round`,
          {
            roundNumber: application.currentRound + 1,
            interviewId: interview._id, // link to interview
            result: interview.result, // "success" or "failure"
            feedback: interview.finalFeedback || "",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Show results screen
        setInterviewResults(interview);
        setCurrentStep("results");
      } else {
        // 🎯 Continue to next question
        const res = await axiosInstance.post("/interview/respond", {
          chatHistory: updatedChatHistory,
          answer: interviewState.answer,
          resume: application.resumeText,
          role: job.title,
          roundType: job.rounds[application.currentRound]?.type,
          topic: job.rounds[application.currentRound]?.description,
          difficulty: job.difficulty,
        });

        const nextQuestion = res.data.message;

        // Append question to chat
        updatedChatHistory.push({
          type: "question",
          content: nextQuestion,
          timestamp: new Date().toLocaleTimeString(),
        });

        setInterviewState((prev: any) => ({
          ...prev,
          chatHistory: updatedChatHistory,
          currentQuestion: prev.currentQuestion + 1,
          question: nextQuestion,
          answer: "",
        }));
      }
    } catch (error) {
      console.error("Error in interview flow:", error);
      toast({
        title: "Error",
        description: "Something went wrong in interview",
        variant: "destructive",
      });
    }
  };

  if (!application || !job) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  // 🟢 Step 1: Waiting / Status Page
  if (currentStep === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
        <Navigation />
        <div className="max-w-3xl mx-auto py-12 px-6">
          {/* Job Info */}
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
            {job.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {job.description}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Difficulty: {job.difficulty}
          </p>
          {job.company && (
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Company: {job.company.name}
            </p>
          )}

          {/* Status Section */}
          <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
            <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              Application Status
            </h2>
            {application.status === "applied" && (
              <p className="text-gray-700 dark:text-gray-300">
                ⏳ Waiting for company approval
              </p>
            )}
            {application.status === "rejected" && (
              <p className="text-red-500 font-medium">
                ❌ Unfortunately, your application was rejected
              </p>
            )}
            {application.status === "selected" && (
              <p className="text-yellow-500">
                ⚡ You are selected! Waiting for final approval
              </p>
            )}
            {application.status === "final-selected" && (
              <p className="text-green-500 font-bold">
                🎉 Congratulations! You are finally selected
              </p>
            )}
            {application.status === "in-progress" && (
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  👉 Next round: {job.rounds[application.currentRound]?.type}
                </p>
                <button
                  onClick={handleStartInterview}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg"
                >
                  Start Interview
                </button>
              </div>
            )}
          </div>

          {/* Completed Rounds */}
          {application.history && application.history.length > 0 && (
            <div className="mt-8 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
              <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                Completed Rounds
              </h2>
              <ul className="space-y-4">
                {application.history.map((round: any, idx: number) => (
                  <li
                    key={idx}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-[#23263A] dark:border-gray-700"
                  >
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      Round {round.roundNumber}:{" "}
                      {job.rounds[round.roundNumber - 1]?.type || "N/A"}
                    </p>
                    <p
                      className={`mt-1 ${
                        round.result === "success"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      Result: {round.result}
                    </p>
                    {round.feedback && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Feedback: {round.feedback}
                      </p>
                    )}
                    {/* // From the Status/Waiting page where user clicks "View
                    Results" */}
                    {/* <button
                      onClick={() =>
                        navigate(`/student/practice-result`, {
                          state: { interview: round.interviewId }, // ✅ populated interview object
                        })
                      }
                    >
                      View Round Results
                    </button> */}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upcoming Rounds */}
          {application.status === "in-progress" &&
            job.rounds &&
            application.currentRound < job.rounds.length && (
              <div className="mt-8 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                  Upcoming Rounds
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Next Round: {job.rounds[application.currentRound]?.type} –{" "}
                  {job.rounds[application.currentRound]?.description}
                </p>
              </div>
            )}
        </div>

        {/* ✅ Show round results in a modal */}
        {interviewResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#181c2f] rounded-xl p-6 w-full max-w-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
                Round Results
              </h3>
              <PracticeResults
                interview={interviewResults}
                navigate={() => setInterviewResults(null)}
              />
              <button
                onClick={() => setInterviewResults(null)}
                className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🟢 Step 2: Interview
  if (currentStep === "interview") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <PracticeInterview
          setupData={{
            role: job.title,
            resume: application.resumeText,
            roundType: job.rounds[application.currentRound]?.type,
            topic: job.rounds[application.currentRound]?.description,
            difficulty: job.difficulty,
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

  // 🟢 Step 3: Results
  if (currentStep === "results") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <Navigation />
        <PracticeResults interview={interviewResults} navigate={() => {}} />
      </div>
    );
  }

  return null;
};

export default ApplicationDetail;
