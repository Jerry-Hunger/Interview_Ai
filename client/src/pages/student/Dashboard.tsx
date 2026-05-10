import { useNavigate } from "react-router-dom";
import { fetchMyInterviews } from "@/services/api";
import { useFetch } from "@/hooks/useFetch";
import { difficultyConfig } from "@/constants/difficulty";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import {
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Play,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const statusMeta = (raw: string) => {
  const key = (raw || "").toLowerCase();
  if (key === "success" || key === "pass") {
    return {
      label: "通过",
      badgeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      gradient: "from-emerald-500 to-teal-500",
      Icon: CheckCircle,
    };
  }
  if (key === "failure" || key === "fail") {
    return {
      label: "未通过",
      badgeClass: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
      gradient: "from-rose-500 to-pink-500",
      Icon: XCircle,
    };
  }
  return {
    label: "已退出",
    badgeClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500 to-orange-500",
    Icon: AlertCircle,
  };
};

const StatCard = ({ title, value, icon: Icon, gradient }: { title: string; value: number; icon: React.ElementType; gradient: string; }) => (
  <Card className="relative rounded-2xl overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.08] group-hover:opacity-[0.12] transition-opacity`} />
    <CardContent className="relative p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </CardContent>
  </Card>
);

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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-sm"
      >
        ‹
      </button>

      <button
        aria-label="下一页"
        onClick={() => emblaApi && emblaApi.scrollNext()}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-sm"
      >
        ›
      </button>
    </div>
  );
};

const StudentDashboard = () => {
  const { data: interviews, loading: isPending } = useFetch(() => fetchMyInterviews());
  const navigate = useNavigate();

  // interviews 可能为 null（useFetch 初始值），使用 ?? [] 保证安全
  const list = interviews ?? [];
  const total = list.length;
  const passed = list.filter((i: { result: string }) => i.result === "success").length;
  const failed = list.filter((i: { result: string }) => i.result === "failure").length;
  const quit = list.filter((i: { result: string }) => i.result === "quit").length;

  const groups = {
    通过: list.filter((i: { result: string }) => i.result === "success"),
    未通过: list.filter((i: { result: string }) => i.result === "failure"),
    已退出: list.filter((i: { result: string }) => i.result === "quit"),
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#0F172A] dark:via-[#1E293B]/50 dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">我的面试</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">追踪你的练习进度</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="总面试数" value={total} icon={BarChart} gradient="from-indigo-500 to-purple-600" />
          <StatCard title="通过" value={passed} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" />
          <StatCard title="未通过" value={failed} icon={XCircle} gradient="from-rose-500 to-pink-500" />
          <StatCard title="已退出" value={quit} icon={AlertCircle} gradient="from-amber-500 to-orange-500" />
        </div>

        {/* 通过率提示 */}
        {total > 0 && (
          <Card className="rounded-2xl border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">整体通过率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round((passed / total) * 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${(passed / total) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {passed}/{total}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 面试记录 */}
        {Object.entries(groups).map(([status, items]) =>
          items.length > 0 ? (
            <div key={status} className="space-y-4">
              {/* 分组标题 */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  status === "通过" ? "bg-emerald-100 dark:bg-emerald-900/50" :
                  status === "未通过" ? "bg-rose-100 dark:bg-rose-900/50" :
                  "bg-amber-100 dark:bg-amber-900/50"
                }`}>
                  {status === "通过" ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                   status === "未通过" ? <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> :
                   <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{status}的面试</h2>
                <Badge variant="secondary" className="rounded-full">{items.length}</Badge>
              </div>

              {/* 轮播卡片 */}
              <Carousel>
                {items.map((i: { result: string; difficulty: string, _id: string, currentRound?: number, rounds?: number, type?: string, createdAt: string }, index: number) => {
                  const meta = statusMeta(i.result);
                  const diff = difficultyConfig[i.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;

                  return (
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
                      className="min-w-[300px] cursor-pointer rounded-2xl border-0 bg-white/90 dark:bg-[#181A2A]/80 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group"
                    >
                      {/* 顶部渐变条 */}
                      <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />

                      <CardHeader className="relative pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {i.type === "practice" && (
                                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">
                                  练习
                                </Badge>
                              )}
                              {i.rounds && i.rounds > 1 && (
                                <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-100 dark:border-purple-800">
                                  {i.currentRound || 1}/{i.rounds}轮
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white truncate">
                              {i.type === "practice" ? `练习面试 ${items.length - index}` : "企业面试"}
                            </CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(i.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <Badge className={`${meta.badgeClass} shrink-0`}>
                            <meta.Icon className="w-3 h-3 mr-1" />
                            <span className="text-xs font-medium">{meta.label}</span>
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* 难度 */}
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${diff.bg}`}>
                            <Gauge className={`w-3.5 h-3.5 ${diff.color}`} />
                            <span className={`text-xs font-medium ${diff.color}`}>{diff.label}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* 分隔线 */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-gray-700 to-transparent" />

                        {/* 查看详情提示 */}
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                          点击查看面试详情 →
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </Carousel>
            </div>
          ) : null
        )}

        {/* 空状态 */}
        {total === 0 && (
          <Card className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-sm shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">还没有面试记录</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">开始你的第一次AI模拟面试吧</p>
              <Button
                onClick={() => navigate("/student/practice")}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="w-4 h-4" />
                开始练习
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;