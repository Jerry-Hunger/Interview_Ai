import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import PracticeInterview from "@/components/practice/PracticeInterview";
import PracticeResults from "@/components/practice/PracticeResults";
import { useToast } from "@/hooks/use-toast";

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

const ApplicationDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [job, setJob] = useState<JobType | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get(`/applications/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setApplication(res.data);
        setJob(res.data.jobId);
      } catch {
        toast({
          title: "错误",
          description: "加载申请详情失败",
          variant: "destructive",
        });
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

      const res = await axiosInstance.post("/interview/start", {
        role: job.title,
        resume: resumeToUse,
        roundType: job.rounds[application.currentRound]?.type || "综合面试",
        topic: job.rounds[application.currentRound]?.description || "",
        difficulty: job.difficulty,
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

      setCurrentStep("interview");
      } catch {
      toast({
        title: "错误",
        description: "启动面试失败",
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
          role: job.title,
          roundType: job.rounds[application.currentRound]?.type,
          topic: job.rounds[application.currentRound]?.description,
          difficulty: job.difficulty,
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

  if (!application || !job) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#101322] flex items-center justify-center text-gray-600 dark:text-gray-300">
        加载中...
      </div>
    );
  }

  if (currentStep === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-[#101322] dark:via-[#1a1f36] dark:to-[#101322]">
        <Navigation />
        <div className="max-w-3xl mx-auto py-12 px-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {job.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {job.description}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            难度：{job.difficulty}
          </p>
          {job.company && (
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              公司：{job.company.name}
            </p>
          )}

          <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
            <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
              申请状态
            </h2>
            {application.status === "applied" && (
              <p className="text-gray-700 dark:text-gray-300">
                ⏳ 等待企业审核
              </p>
            )}
            {application.status === "rejected" && (
              <p className="text-red-500 dark:text-red-400 font-medium">
                ❌ 很遗憾，您的申请已被拒绝
              </p>
            )}
            {application.status === "selected" && (
              <p className="text-yellow-500 dark:text-yellow-400">
                ⚡ 您已通过！等待最终审核
              </p>
            )}
            {application.status === "final-selected" && (
              <p className="text-green-500 dark:text-green-400 font-bold">
                🎉 恭喜！您已最终通过
              </p>
            )}
            {application.status === "in-progress" && (
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  👉 下一轮：{job.rounds[application.currentRound]?.type}
                </p>
                <button
                  onClick={handleStartInterview}
                  className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg dark:from-indigo-600 dark:to-purple-700"
                >
                  开始面试
                </button>
              </div>
            )}
          </div>

          {application.history && application.history.length > 0 && (
            <div className="mt-8 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
              <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                已完成的面试
              </h2>
              <ul className="space-y-4">
                {application.history?.map((round: RoundHistory, idx: number) => (
                  <li
                    key={idx}
                    className="p-3 border rounded-lg bg-gray-50 dark:bg-[#23263A] dark:border-gray-700"
                  >
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      第 {round.roundNumber} 轮：{job.rounds[round.roundNumber - 1]?.type || "未知"}
                    </p>
                    <p
                      className={`mt-1 ${
                        round.result === "success"
                          ? "text-green-500 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      结果：{round.result === "success" ? "通过" : "未通过"}
                    </p>
                    {round.feedback && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        反馈：{round.feedback}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {application.status === "in-progress" &&
            job.rounds &&
            application.currentRound < job.rounds.length && (
              <div className="mt-8 p-4 rounded-2xl bg-white dark:bg-[#181c2f] shadow-md">
                <h2 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                  即将到来的面试
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  下一轮：{job.rounds[application.currentRound]?.type} – {job.rounds[application.currentRound]?.description}
                </p>
              </div>
            )}

          {interviewResults && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#181c2f] rounded-xl p-6 w-full max-w-2xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
                  面试结果
                </h3>
                <PracticeResults
                  interview={interviewResults}
                  navigate={() => setInterviewResults(null)}
                />
                <button
                  onClick={() => setInterviewResults(null)}
                  className="cursor-pointer mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
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
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <PracticeInterview
          setupData={{
            role: job.title,
            resume: resumeText,
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
