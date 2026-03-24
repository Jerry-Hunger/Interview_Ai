import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Target, Play, CheckCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ResumeUploader from "./ResumeUploader";

type SetupData = {
  resume: string;
  role: string;
  difficulty: string;
  roundType: string;
  topic: string;
};

type PracticeSetupProps = {
  setupData: SetupData;
  setSetupData: React.Dispatch<React.SetStateAction<SetupData>>;
  handleSetupSubmit: () => void;
  navigate: (path: string) => void;
  isStarting: boolean;
};

const PracticeSetup = ({
  setupData,
  setSetupData,
  handleSetupSubmit,
  navigate,
  isStarting,
}: PracticeSetupProps) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/student/dashboard")}
        className="mb-4 text-indigo-500 dark:text-indigo-400"
      >
        返回仪表盘
      </Button>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        模拟面试设置
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        配置您的面试环节，获得最佳练习体验
      </p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Setup Form */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <Target size={20} />
            面试配置
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            自定义您的练习会话设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resume Upload */}
          {/* Resume Upload */}
          {/* <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Upload size={16} />
              Resume <span className="text-red-500">*</span>
            </Label>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
              {setupData.resume ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white truncate w-60">
                    ✅ Resume uploaded
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSetupData((prev) => ({ ...prev, resume: "" }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload
                    className="mx-auto text-indigo-500 dark:text-indigo-400 mb-2"
                    size={32}
                  />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    Upload your resume (PDF, DOC, DOCX)
                  </p>
                  <Button
                    variant="outline"
                    className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                    onClick={async () => {
                      try {
                        const { file, text } = await pickResumeFile();
                        setSetupData((prev) => ({
                          ...prev,
                          resume: { file, text },
                        }));
                      } catch (error: unknown) {
                        const err = error as { message?: string };
                        alert(err.message || "Error");
                      }
                    }}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div> */}
          <ResumeUploader
            dataChanged={(data: { resumeText: string }) => {
              setSetupData((prev) => ({ ...prev, resume: data.resumeText }));
            }}
          />
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-900 dark:text-white">
              目标职位 *
            </Label>
            <Input
              id="role"
              placeholder="例如：软件工程师、产品经理"
              value={setupData.role}
              onChange={(e) =>
                setSetupData((prev) => ({ ...prev, role: e.target.value }))
              }
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          {/* Difficulty */}
          <div className="space-y-2">
            <Label
              htmlFor="difficulty"
              className="text-gray-900 dark:text-white"
            >
              难度等级 *
            </Label>
            <Select
              onValueChange={(value) =>
                setSetupData((prev) => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="选择难度" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#23263A]">
                <SelectItem value="beginner">初级（0-2年）</SelectItem>
                <SelectItem value="intermediate">
                  中级（2-5年）
                </SelectItem>
                <SelectItem value="senior">高级（5年以上）</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Round Type */}
          <div className="space-y-2">
            <Label
              htmlFor="roundType"
              className="text-gray-900 dark:text-white"
            >
              面试类型 *
            </Label>
            <Select
              onValueChange={(value) =>
                setSetupData((prev) => ({ ...prev, roundType: value }))
              }
            >
              <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="选择面试类型" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#23263A]">
                <SelectItem value="behavioral">行为面试</SelectItem>
                <SelectItem value="technical">技术面试</SelectItem>
                <SelectItem value="system-design">系统设计</SelectItem>
                <SelectItem value="coding">编程挑战</SelectItem>
                <SelectItem value="mixed">综合面试</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Topic Focus */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-gray-900 dark:text-white">
              重点领域（可选）
            </Label>
            <Textarea
              id="topic"
              placeholder="您想重点练习哪些特定话题？"
              value={setupData.topic}
              onChange={(e) =>
                setSetupData((prev) => ({
                  ...prev,
                  topic: e.target.value,
                }))
              }
              rows={3}
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
          <Button
            onClick={handleSetupSubmit}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg transition-all duration-300"
            size="lg"
          >
            <Play size={16} className="mr-2" />
            开始面试
          </Button>
        </CardContent>
      </Card>
      {/* Preview/Tips */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">
            面试技巧
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            充分利用您的练习环节
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Tips */}
            {[
              {
                title: "环境准备",
                desc: "找一个安静、光线充足、网络稳定的空间",
              },
              {
                title: "摄像头和麦克风",
                desc: "开始前测试您的设备",
              },
              {
                title: "大声思考",
                desc: "说出您的思考过程",
              },
              {
                title: "使用STAR法则",
                desc: "情境、任务、行动、结果 - 用于回答行为面试问题",
              },
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle
                  className="text-green-500 dark:text-green-400 mt-1"
                  size={16}
                />
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {tip.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="p-4 bg-indigo-50 dark:bg-[#23263A] rounded-lg">
            <h4 className="font-medium text-indigo-500 dark:text-indigo-400 mb-2">
              面试内容预览
            </h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <li>• 根据您的选择提供5-8个问题</li>
              <li>• 实时反馈和评分</li>
              <li>• 详细的性能分析</li>
              <li>• 改进建议</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>

      {isStarting && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-[#1a1c29] rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center space-y-6">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                准备面试中
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                正在生成第一个问题...
              </p>
            </div>
            <Progress value={undefined} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500 [&>div]:animate-pulse" />
            <p className="text-xs text-gray-400">请稍候，这可能需要几秒钟</p>
          </div>
        </div>
      )}
    </div>
);

export default PracticeSetup;
