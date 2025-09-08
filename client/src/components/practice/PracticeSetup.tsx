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
import { Target, Play, CheckCircle } from "lucide-react";
import ResumeUploader from "./ResumeUploader";

const PracticeSetup = ({
  setupData,
  setSetupData,
  handleSetupSubmit,
  navigate,
}: any) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/student/dashboard")}
        className="mb-4 text-indigo-500 dark:text-indigo-400"
      >
        Back to Dashboard
      </Button>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Practice Interview Setup
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        Configure your interview session for the best practice experience
      </p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Setup Form */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <Target size={20} />
            Interview Configuration
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Customize your practice session settings
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
                      setSetupData((prev: any) => ({ ...prev, resume: null }))
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
                        setSetupData((prev: any) => ({
                          ...prev,
                          resume: { file, text },
                        }));
                      } catch (error: any) {
                        alert(error.message);
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
            dataChanged={(data) => {
              setSetupData((prev: any) => ({ ...prev, resume: data }));
            }}
          />
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-900 dark:text-white">
              Target Role *
            </Label>
            <Input
              id="role"
              placeholder="e.g., Software Engineer, Product Manager"
              value={setupData.role}
              onChange={(e) =>
                setSetupData((prev: any) => ({ ...prev, role: e.target.value }))
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
              Difficulty Level *
            </Label>
            <Select
              onValueChange={(value) =>
                setSetupData((prev: any) => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#23263A]">
                <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                <SelectItem value="intermediate">
                  Intermediate (2-5 years)
                </SelectItem>
                <SelectItem value="senior">Senior (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Round Type */}
          <div className="space-y-2">
            <Label
              htmlFor="roundType"
              className="text-gray-900 dark:text-white"
            >
              Interview Round *
            </Label>
            <Select
              onValueChange={(value) =>
                setSetupData((prev: any) => ({ ...prev, roundType: value }))
              }
            >
              <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select round type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#23263A]">
                <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                <SelectItem value="technical">Technical Interview</SelectItem>
                <SelectItem value="system-design">System Design</SelectItem>
                <SelectItem value="coding">Coding Challenge</SelectItem>
                <SelectItem value="mixed">Mixed Round</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Topic Focus */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-gray-900 dark:text-white">
              Focus Area (Optional)
            </Label>
            <Textarea
              id="topic"
              placeholder="Any specific topics you'd like to focus on?"
              value={setupData.topic}
              onChange={(e) =>
                setSetupData((prev: any) => ({
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
            Start Interview
          </Button>
        </CardContent>
      </Card>
      {/* Preview/Tips */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">
            Interview Tips
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Make the most of your practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Tips */}
            {[
              {
                title: "Environment Setup",
                desc: "Find a quiet, well-lit space with stable internet",
              },
              {
                title: "Camera & Microphone",
                desc: "Test your equipment before starting",
              },
              {
                title: "Think Out Loud",
                desc: "Verbalize your thought process",
              },
              {
                title: "Use STAR Method",
                desc: "Situation, Task, Action, Result for behavioral questions",
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
              What to Expect
            </h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <li>• 5-8 questions based on your selections</li>
              <li>• Real-time feedback and scoring</li>
              <li>• Detailed performance analysis</li>
              <li>• Improvement recommendations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default PracticeSetup;
