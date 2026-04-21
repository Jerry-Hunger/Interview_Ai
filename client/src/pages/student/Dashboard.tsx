import { useNavigate } from "react-router-dom";
import { useMyInterviews } from "@/hooks/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import {
  Calendar,
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Play,
} from "lucide-react";

const statusMeta = (raw: string) => {
  const key = (raw || "").toLowerCase();
  if (key === "success" || key === "pass") {
    return {
      label: "通过",
      badgeClass:
        "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20",
      ringClass: "hover:ring-green-300/60 dark:hover:ring-green-500/30",
      Icon: CheckCircle,
    };
  }
  if (key === "failure" || key === "fail") {
    return {
      label: "未通过",
      badgeClass: "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20",
      ringClass: "hover:ring-red-300/60 dark:hover:ring-red-500/30",
      Icon: XCircle,
    };
  }
  return {
    label: "已退出",
    badgeClass:
      "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    ringClass: "hover:ring-yellow-300/60 dark:hover:ring-yellow-500/30",
    Icon: AlertCircle,
  };
};

type Interview = {
  _id: string;
  result: "success" | "failure" | "quit" | "Quit";
  difficulty: string;
  type: "practice" | "company";
  createdAt: string;
  rounds?: number;
  currentRound?: number;
  chatHistory?: { type: string; content: string; timestamp: string }[];
  feedbacks?: string[];
  finalFeedback?: string;
  roleSummary?: string;
};

const Carousel = ({ children }: { children: React.ReactNode }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">{children}</div>
      </div>

      <button
        aria-label="上一页"
        onClick={() => emblaApi && emblaApi.scrollPrev()}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        ‹
      </button>

      <button
        aria-label="下一页"
        onClick={() => emblaApi && emblaApi.scrollNext()}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        ›
      </button>
    </div>
  );
};

const StudentDashboard = () => {
  const { data: interviews = [], isPending } = useMyInterviews();
  const navigate = useNavigate();

  const total = interviews.length;
  const passed = interviews.filter((i) => i.result === "success").length;
  const failed = interviews.filter((i) => i.result === "failure").length;
  const quit = interviews.filter((i) => i.result === "quit").length;

  const groups = {
    通过: interviews.filter((i) => i.result === "success"),
    未通过: interviews.filter((i) => i.result === "failure"),
    已退出: interviews.filter((i) => i.result === "quit"),
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          我的面试
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总面试数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
              </div>
              <BarChart className="text-indigo-500 dark:text-indigo-400" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">通过</p>
                <p className="text-2xl font-bold text-green-500 dark:text-green-400">{passed}</p>
              </div>
              <CheckCircle className="text-green-500 dark:text-green-400" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">未通过</p>
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">{failed}</p>
              </div>
              <XCircle className="text-red-500 dark:text-red-400" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已退出</p>
                <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{quit}</p>
              </div>
              <AlertCircle className="text-yellow-500 dark:text-yellow-400" size={28} />
            </CardContent>
          </Card>
        </div>

        {Object.entries(groups).map(([status, items]) =>
          items.length > 0 ? (
            <div key={status} className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                {status}的面试
              </h2>
              <Carousel>
                {items.map((i, index) => (
                  <Card
                    key={i._id}
                    onClick={() =>
                      navigate("/student/practice-result", {
                        state: { 
                          interview: i,
                          currentRound: i.currentRound || 1,
                          totalRounds: i.rounds || 1,
                          rounds: i.rounds || 1,
                          isCompletedSession: true,
                        },
                      })
                    }
                    className={[
                      "min-w-[280px] cursor-pointer rounded-2xl",
                      "bg-white/90 dark:bg-[#181A2A]/80",
                      "border border-gray-100 dark:border-white/5",
                      "shadow-sm hover:shadow-xl transition-all",
                      "hover:scale-[1.02] hover:border-transparent",
                      "relative overflow-hidden",
                    ].join(" ")}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />

                    <CardHeader className="relative z-10">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold dark:text-white">
                          {i.type === "practice" ? (
                            i.rounds && i.rounds > 1
                              ? `练习面试 ${items.length - index} (${i.currentRound || 1}/${i.rounds}轮)`
                              : `练习面试 ${items.length - index}`
                          ) : "企业面试"}
                        </CardTitle>

                        {(() => {
                          const meta = statusMeta(i.result);
                          return (
                            <Badge
                              variant="outline"
                              className={`px-2 py-0.5 ${meta.badgeClass}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <meta.Icon size={14} />
                                <span className="text-xs font-medium">
                                  {meta.label}
                                </span>
                              </div>
                            </Badge>
                          );
                        })()}
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Gauge size={16} />
                          <span className="font-medium capitalize">
                            {i.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={16} />
                          <span>
                            {new Date(i.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const { ringClass } = statusMeta(i.result);
                        return (
                          <div
                            className={[
                              "h-[2px] w-full rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30",
                              "transition-all",
                              ringClass,
                            ].join(" ")}
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </Carousel>
            </div>
          ) : null
        )}

        <div className="mt-8">
          <Button
            onClick={() => navigate("/student/practice")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white rounded-xl px-6 py-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            <Play size={16} className="mr-2" />
            开始新的练习
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
