import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  TrendingUp,
  Play,
  Building,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PracticeResults = ({ interview, navigate }: any) => {
  const isSuccess = interview.result === "success";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          面试结果
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {interview.type === "practice"
            ? "练习环节总结"
            : "企业面试总结"}
        </p>
      </div>

      {/* Final Feedback */}
      <Card className="mb-8 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">
            最终反馈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {interview.finalFeedback}
          </p>
        </CardContent>
      </Card>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Result */}
        <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-yellow-500 dark:text-yellow-400">
              <Star size={20} />
              结果
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div
              className={`text-4xl font-bold mb-4 ${
                isSuccess
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isSuccess ? "通过" : "未通过"}
            </div>
            <Badge
              variant={isSuccess ? ("success" as any) : ("destructive" as any)}
            >
              {interview.difficulty === "beginner" ? "初级" : interview.difficulty === "intermediate" ? "中级" : "高级"} 难度
            </Badge>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-indigo-500 dark:text-indigo-400">
              下一步
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg"
              onClick={() => navigate("/student/practice")}
            >
              <Play size={16} className="mr-2" />
              再练一次
            </Button>
            <Button
              variant="outline"
              className="w-full text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
              onClick={() => navigate("/student/jobs")}
            >
              <Building size={16} className="mr-2" />
              浏览职位
            </Button>
            <Button
              variant="outline"
              className="w-full text-purple-500 dark:text-purple-400 border border-purple-200 dark:border-purple-700"
              onClick={() => navigate("/student/dashboard")}
            >
              <ArrowLeft size={16} className="mr-2" />
              返回仪表盘
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Chat History */}
      <Card className="mt-8 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">
            面试记录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {interview.chatHistory.map((entry: any, idx: number) => (
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
          ))}
        </CardContent>
      </Card>

      {/* Feedbacks Carousel */}
      <Card className="mt-8 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <TrendingUp size={20} />
            详细反馈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Carousel className="w-full">
            <CarouselContent>
              {interview.feedbacks?.map((fb: string, i: number) => (
                <CarouselItem key={i} className="basis-full">
                  <Card className="bg-indigo-50 dark:bg-indigo-900/30 border-0 shadow-md rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-indigo-600 dark:text-indigo-300 text-lg">
                        第 {i + 1} 部分反馈
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {fb}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-2 mt-4">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeResults;
