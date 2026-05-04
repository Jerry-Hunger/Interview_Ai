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
  Play,
  Building,
  ArrowLeft,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  BookOpen
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
  result: "success" | "failure" | "quit";
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

const difficultyConfig = {
  easy: { label: "简单", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-500 to-teal-500" },
  medium: { label: "中等", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", gradient: "from-amber-500 to-orange-500" },
  hard: { label: "困难", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800", gradient: "from-rose-500 to-pink-500" },
  beginner: { label: "初级", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-500 to-teal-500" },
  intermediate: { label: "中级", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800", gradient: "from-amber-500 to-orange-500" },
};

const markdownComponents = {
  code({ className, children, ...props }: React.ComponentProps<"code">) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    return isInline ? (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono" {...props}>{children}</code>
    ) : (
      <code className={`block p-4 rounded-lg bg-gray-900 dark:bg-gray-800 text-gray-100 text-sm font-mono overflow-x-auto ${className || ""}`} {...props}>{children}</code>
    );
  },
  h1: ({ children }: React.ComponentProps<"h1">) => <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{children}</h1>,
  h2: ({ children }: React.ComponentProps<"h2">) => <h2 className="text-xl font-bold mb-3 mt-6 text-gray-900 dark:text-white">{children}</h2>,
  h3: ({ children }: React.ComponentProps<"h3">) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900 dark:text-white">{children}</h3>,
  p: ({ children }: React.ComponentProps<"p">) => <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>,
  ul: ({ children }: React.ComponentProps<"ul">) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
  ol: ({ children }: React.ComponentProps<"ol">) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
  li: ({ children }: React.ComponentProps<"li">) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
  strong: ({ children }: React.ComponentProps<"strong">) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
  em: ({ children }: React.ComponentProps<"em">) => <em className="italic">{children}</em>,
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
  const isQuit = interview.result === "quit" || interview.result === "Quit";
  const diff = difficultyConfig[interview.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

  const [pendingNextRound, setPendingNextRound] = useState<PendingNextRound | null>(null);
  const [previousResults, setPreviousResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem("pendingNextRound");
    if (!stored) return;
    const parsed: PendingNextRound = JSON.parse(stored);
    // 设置 pendingNextRound 状态，无需等待 API 验证
    // API 验证是可选的：即使失败，只要 localStorage 有值就允许继续
    setPendingNextRound(parsed);
    axiosInstance
      .get(`/interview/${parsed.interviewId}`)
      .then((res) => {
        if (res.data.result) {
          localStorage.removeItem("pendingNextRound");
          setPendingNextRound(null);
        }
      })
      .catch(() => {
        // API 失败时保持 pendingNextRound 状态不变
        // 因为 localStorage 中有值说明用户已完成本轮面试
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
      // 如果 API 调用失败导致 previousResults 为空字符串，仍允许继续（信任 localStorage 的状态）
      return previousInterviewIds.every((id) => previousResults[id] === "success" || previousResults[id] === "");
    }
    return true;
  };

  const handleContinue = () => {
    localStorage.removeItem("pendingNextRound");
    const nextRound = currentRound + 1;
    const setupDataWithInterview = {
      ...setupData,
      role: setupData?.role || interview.role || interview.roleSummary || "",
      roundType: setupData?.roundType || interview.roundType || "",
      difficulty: setupData?.difficulty || interview.difficulty || "",
      rounds: setupData?.rounds || totalRounds || interview.rounds || 1,
      questionsPerRound: setupData?.questionsPerRound || 5,
      resume: setupData?.resume || interview.resumeText || "",
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
  // 企业面试的继续下一轮按钮不应该显示，是否能进行下一轮由企业端决定
  const showEnterpriseContinueButton = interview.type === "company" ? false : showContinueButton;
  const showFailMessage = !isLastRound && interview.result === "failure" && !state?.isCompletedSession;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">面试结果</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {interview.type === "practice" ? "练习环节总结" : "企业面试总结"}
        </p>
      </div>

      {/* 结果总览卡片 */}
      <Card className="rounded-2xl border-0 overflow-hidden shadow-xl">
        {/* 顶部渐变背景 */}
        <div className={`h-2 bg-gradient-to-r ${isQuit ? 'from-gray-500 via-slate-500 to-gray-600' : isSuccess ? 'from-emerald-500 via-teal-500 to-cyan-500' : 'from-rose-500 via-pink-500 to-red-500'}`} />

        {/* 主内容区 */}
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左侧 - 结果状态 */}
            <div className={`lg:w-64 rounded-2xl p-6 flex flex-col items-center justify-center ${isQuit ? 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20' : isSuccess ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20' : 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isQuit ? 'bg-gradient-to-br from-gray-500 to-slate-500 shadow-lg shadow-gray-500/30' : isSuccess ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30'}`}>
                {isQuit ? (
                  <Clock className="w-10 h-10 text-white" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className={`text-2xl font-bold ${isQuit ? 'text-gray-600 dark:text-gray-400' : isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isQuit ? "已退出" : isSuccess ? "恭喜通过" : "未通过"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {interview.type === "practice" ? "练习面试" : "企业面试"}
              </p>
              <div className={`mt-3 px-3 py-1.5 rounded-full text-sm font-medium ${diff.bg} ${diff.color} border ${diff.border}`}>
                {diff.label}难度
              </div>
            </div>

            {/* 右侧 - 详细信息 */}
            <div className="flex-1 space-y-4">
              {/* 角色信息 */}
              {interview.roleSummary && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">面试角色</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{interview.roleSummary}</p>
                  </div>
                </div>
              )}

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-3">
                {interview.rounds && interview.rounds > 1 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">当前轮次</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentRound} / {totalRounds}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">面试时间</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(interview.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3 pt-2">
                {showEnterpriseContinueButton && (
                  <Button
                    onClick={handleContinue}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    继续下一轮 ({currentRound}/{totalRounds})
                  </Button>
                )}
                <Button
                  onClick={() => navigate("/student/practice")}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-4 h-4" />
                  再练一次
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/student/dashboard")}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回仪表盘
                </Button>
              </div>

              {showFailMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                  <p className="text-sm text-rose-600 dark:text-rose-400 font-medium text-center">
                    本轮面试未通过，无法进行下一轮面试
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分项反馈 */}
      {interview.feedbacks && interview.feedbacks.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">分项反馈</CardTitle>
              <Badge variant="secondary" className="rounded-full">{interview.feedbacks.length} 项</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
              {interview.feedbacks.map((fb, idx) => (
                <AccordionItem key={idx} value={`chunk-${idx}`} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-gray-800/50 text-left w-full transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        第 {idx + 1} 部分反馈
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {fb}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 最终反馈 */}
      {interview.finalFeedback && (
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">最终反馈</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {interview.finalFeedback}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 面试记录 */}
      {interview.chatHistory && interview.chatHistory.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-slate-400 via-slate-500 to-gray-600" />
          <CardHeader className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">面试记录</CardTitle>
              <Badge variant="secondary" className="rounded-full">{interview.chatHistory.length} 条</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {interview.chatHistory.map((entry, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl transition-colors ${
                  entry.type === "question"
                    ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800/50"
                    : "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-100 dark:border-emerald-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${entry.type === "question" ? "bg-indigo-500" : "bg-emerald-500"}`}>
                      <MessageSquare size={12} className="text-white" />
                    </div>
                    <span className={`text-xs font-medium ${entry.type === "question" ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {entry.type === "question" ? "面试官" : "你"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{entry.timestamp}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {entry.content}
                  </ReactMarkdown>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 底部操作 */}
      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={() => navigate("/student/jobs")} className="gap-2">
          <Building className="w-4 h-4" />
          浏览职位
        </Button>
      </div>
    </div>
  );
};

export default PracticeResults;