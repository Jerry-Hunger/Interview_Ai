import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star,
  Play,
  Building,
  ArrowLeft,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

type Interview = {
  _id: string;
  type: "practice" | "company";
  role: string;
  difficulty: string;
  roundType: string;
  result: "success" | "failure" | "Quit";
  feedback: string;
  transcript: { role: string; content: string }[];
  createdAt: string;
  finalFeedback?: string;
  chatHistory?: { type: string; content: string; timestamp: string }[];
  feedbacks?: string[];
  roleSummary?: string;
  rounds?: number;
  currentRound?: number;
};

type SetupData = {
  resume: string;
  role: string;
  difficulty: string;
  roundType: string;
  topic: string;
  rounds: number;
  questionsPerRound: number;
};

type PendingNextRound = {
  interviewId: string;
  nextRound: number;
};

type PracticeResultsProps = {
  interview: Interview;
  navigate: (path: string, options?: { state?: unknown }) => void;
  setupData?: SetupData;
  rounds?: number;
  previousInterviewIds?: string[];
};

const markdownComponents = {
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    return isInline ? (
      <code
        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={`block p-4 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 text-sm font-mono overflow-x-auto ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  h1: ({ children }: React.ComponentProps<"h1">) => (
    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{children}</h1>
  ),
  h2: ({ children }: React.ComponentProps<"h2">) => (
    <h2 className="text-xl font-bold mb-3 mt-6 text-gray-900 dark:text-white">{children}</h2>
  ),
  h3: ({ children }: React.ComponentProps<"h3">) => (
    <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900 dark:text-white">{children}</h3>
  ),
  p: ({ children }: React.ComponentProps<"p">) => (
    <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>
  ),
  ul: ({ children }: React.ComponentProps<"ul">) => (
    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: React.ComponentProps<"ol">) => (
    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: React.ComponentProps<"li">) => (
    <li className="text-gray-700 dark:text-gray-300">{children}</li>
  ),
  strong: ({ children }: React.ComponentProps<"strong">) => (
    <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }: React.ComponentProps<"em">) => (
    <em className="italic">{children}</em>
  ),
};

const PracticeResults = ({
  interview,
  navigate,
  setupData,
  previousInterviewIds = [],
}: PracticeResultsProps) => {
  const location = useLocation();
  const state = location.state as {
    currentRound?: number;
    totalRounds?: number;
    roundInterviewIds?: string[];
    isCompletedSession?: boolean;
    setupData?: SetupData;
  } | undefined;

  const currentRound = state?.currentRound || interview.currentRound || 1;
  const totalRounds = state?.totalRounds || interview.rounds || 1;
  const isLastRound = currentRound >= totalRounds;
  const isSuccess = interview.result === "success";

  const [pendingNextRound, setPendingNextRound] = useState<PendingNextRound | null>(null);
  const [previousResults, setPreviousResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("pendingNextRound");
    if (!stored) return;
    const parsed: PendingNextRound = JSON.parse(stored);
    axiosInstance
      .get(`/interview/${parsed.interviewId}`)
      .then((res) => {
        if (res.data.result) {
          localStorage.removeItem("pendingNextRound");
          setPendingNextRound(null);
        } else {
          setPendingNextRound(parsed);
        }
      })
      .catch(() => {
        setPendingNextRound(parsed);
      });
    }, []);

  useEffect(() => {
    if (previousInterviewIds.length === 0) return;
    const loadResults = async () => {
      const results: Record<string, string> = {};
      for (const id of previousInterviewIds) {
        try {
          const res = await axiosInstance.get(`/interview/${id}`);
          results[id] = res.data.result;
        } catch {
          results[id] = "";
        }
      }
      setPreviousResults(results);
    };
    loadResults();
  }, [previousInterviewIds]);

  const canContinue = () => {
    if (currentRound >= totalRounds) return false;
    if (interview.result !== "success") return false;
    if (pendingNextRound && pendingNextRound.interviewId === interview._id) return false;
    if (pendingNextRound) return true;
    if (previousInterviewIds.length > 0) {
      return previousInterviewIds.every((id) => previousResults[id] === "success");
    }
    return true;
  };

  const handleContinue = () => {
    localStorage.removeItem("pendingNextRound");
    const nextRound = currentRound + 1;
    const setupDataWithInterview = {
      ...setupData,
      role: setupData?.role || interview.roleSummary || "",
      roundType: setupData?.roundType || interview.roundType || "",
      difficulty: setupData?.difficulty || interview.difficulty || "",
      rounds: setupData?.rounds || totalRounds || interview.rounds || 1,
      questionsPerRound: setupData?.questionsPerRound || 5,
    };
    navigate("/student/practice", {
      state: {
        continueRound: true,
        previousRoundIds: state?.roundInterviewIds,
        setupData: setupDataWithInterview,
        currentRound: nextRound,
        previousFeedback: interview.finalFeedback,
      },
    });
  };

  const showContinueButton = canContinue();
  const showFailMessage =
    !isLastRound && interview.result === "failure" && !state?.isCompletedSession;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">面试结果</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {interview.type === "practice" ? "练习环节总结" : "企业面试总结"}
        </p>
      </div>

      {/* Chunk Feedbacks */}
      {interview.feedbacks && interview.feedbacks.length > 0 && (
        <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-indigo-500 dark:text-indigo-400">分项反馈</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
              {interview.feedbacks.map((fb, idx) => (
                <AccordionItem
                  key={idx}
                  value={`chunk-${idx}`}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left w-full">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      第 {idx + 1} 部分反馈
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {fb}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Final Feedback */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">最终反馈</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {interview.finalFeedback}
          </ReactMarkdown>
        </CardContent>
      </Card>

      {/* Result + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl w-full flex flex-col justify-center min-h-[200px]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-yellow-500 dark:text-yellow-400">
              <Star size={20} />
              结果
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center flex flex-col items-center justify-center flex-1">
            <div
              className={`text-4xl font-bold mb-4 ${
                isSuccess
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isSuccess ? "通过" : "未通过"}
            </div>
            <Badge variant={isSuccess ? "default" : "destructive"}>
              {interview.difficulty === "beginner"
                ? "初级"
                : interview.difficulty === "intermediate"
                  ? "中级"
                  : "高级"}{" "}
              难度
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl w-full">
          <CardHeader>
            <CardTitle className="text-indigo-500 dark:text-indigo-400">下一步</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {showContinueButton && (
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={handleContinue}
              >
                <ArrowRight size={16} className="mr-2" />
                继续下一轮面试 ({currentRound}/{totalRounds})
              </Button>
            )}
            {showFailMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  本轮面试未通过，无法进行下一轮面试
                </p>
              </div>
            )}
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onClick={() => navigate("/student/practice")}
            >
              <Play size={16} className="mr-2" />
              再练一次
            </Button>
            <Button
              variant="outline"
              className="w-full text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onClick={() => navigate("/student/jobs")}
            >
              <Building size={16} className="mr-2" />
              浏览职位
            </Button>
            <Button
              variant="outline"
              className="w-full text-purple-500 dark:text-purple-400 border border-purple-200 dark:border-purple-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
              onClick={() => navigate("/student/dashboard")}
            >
              <ArrowLeft size={16} className="mr-2" />
              返回仪表盘
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chat History */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">面试记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {interview.chatHistory?.map(
            (
              entry: { type: string; content: string; timestamp: string },
              idx: number
            ) => (
              <div
                key={idx}
                className={`p-3 rounded-xl ${
                  entry.type === "question"
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare size={14} />
                  <span className="text-xs opacity-70">{entry.timestamp}</span>
                </div>
                <p className="text-sm">{entry.content}</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeResults;
