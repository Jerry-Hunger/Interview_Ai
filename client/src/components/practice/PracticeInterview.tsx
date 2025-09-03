import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  MessageCircle,
  FileText,
  Play,
  Pause,
  Mic,
  MicOff,
  Send,
  Camera,
  CameraOff,
  User,
} from "lucide-react";

const PracticeInterview = ({
  setupData,
  interviewState,
  setInterviewState,
  handleAnswerSubmit,
  formatTime,
}: any) => {
  const currentQuestion =
    interviewState.questions[interviewState.currentQuestion - 1];
  const isLastQuestion =
    interviewState.currentQuestion > interviewState.totalQuestions;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
        {/* Left Sidebar - Metadata */}
        <Card className="col-span-3 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-indigo-500 dark:text-indigo-400">
              Interview Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Role
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {setupData.role}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Round Type
              </Label>
              <Badge variant="secondary" className="mt-1 dark:text-gray-400">
                {setupData.roundType}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  Progress
                </Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.min(
                    interviewState.currentQuestion,
                    interviewState.totalQuestions
                  )}
                  /{interviewState.totalQuestions}
                </span>
              </div>
              <Progress
                value={
                  (Math.min(
                    interviewState.currentQuestion,
                    interviewState.totalQuestions
                  ) /
                    interviewState.totalQuestions) *
                  100
                }
                className="bg-indigo-200 dark:bg-indigo-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock
                size={16}
                className="text-indigo-500 dark:text-indigo-400"
              />
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {formatTime(interviewState.timeRemaining)}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">
                Current Question #{interviewState.currentQuestion}
              </Label>
              <div className="p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg text-sm text-gray-900 dark:text-white">
                {isLastQuestion ? "Interview Complete!" : currentQuestion}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center - Interview Windows */}
        <div className="col-span-6 space-y-6">
          <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardContent className="p-4 grid grid-cols-2 gap-6 justify-items-center">
              {/* AI Interviewer Window */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-200 dark:bg-[#23263A] rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1698047681452-08eba22d0c64?w=600&auto=format&fit=crop&q=60" // <-- replace with your AI interviewer image
                    alt="AI Interviewer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  AI Interviewer
                </p>
              </div>

              {/* Candidate Window */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-200 dark:bg-[#23263A] rounded-lg overflow-hidden shadow-md flex items-center justify-center relative">
                  {interviewState.isCameraOn ? (
                    <video
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (
                          el &&
                          interviewState.isCameraOn &&
                          navigator.mediaDevices
                        ) {
                          navigator.mediaDevices
                            .getUserMedia({ video: true })
                            .then((stream) => {
                              el.srcObject = stream;
                            });
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <CameraOff
                        className="mx-auto text-gray-400 dark:text-gray-500 mb-2"
                        size={32}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Turn on Camera
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                    onClick={() =>
                      setInterviewState((prev: any) => ({
                        ...prev,
                        isCameraOn: !prev.isCameraOn,
                      }))
                    }
                  >
                    {interviewState.isCameraOn ? (
                      <CameraOff size={14} />
                    ) : (
                      <Camera size={14} />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Candidate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Answer Input */}
          {!isLastQuestion && (
            <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-indigo-500 dark:text-indigo-400">
                  <span className="flex items-center gap-2">
                    <FileText size={20} />
                    Your Response
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={
                        interviewState.isRecording ? "destructive" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setInterviewState((prev: any) => ({
                          ...prev,
                          isRecording: !prev.isRecording,
                        }))
                      }
                    >
                      {interviewState.isRecording ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                      {interviewState.isRecording ? "Recording..." : "Record"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your answer here or use voice recording..."
                  value={interviewState.answer}
                  onChange={(e) =>
                    setInterviewState((prev: any) => ({
                      ...prev,
                      answer: e.target.value,
                    }))
                  }
                  rows={6}
                  className="resize-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setInterviewState((prev: any) => ({
                          ...prev,
                          isMicOn: !prev.isMicOn,
                        }))
                      }
                      className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                    >
                      {interviewState.isMicOn ? (
                        <Mic size={14} />
                      ) : (
                        <MicOff size={14} />
                      )}
                    </Button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Microphone {interviewState.isMicOn ? "on" : "off"}
                    </span>
                  </div>
                  <Button
                    onClick={handleAnswerSubmit}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg"
                    disabled={!interviewState.answer.trim()}
                  >
                    <Send size={14} className="mr-2" />
                    Submit Answer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Chat History */}
        <Card className="col-span-3 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-500 dark:text-indigo-400">
              Chat History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                {interviewState.chatHistory.map((chat: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      chat.type === "question"
                        ? "bg-indigo-50 dark:bg-[#23263A] border border-indigo-200 dark:border-indigo-700"
                        : "bg-purple-50 dark:bg-[#23263A] border border-purple-200 dark:border-purple-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {chat.type === "question" ? (
                        <MessageCircle
                          size={14}
                          className="text-indigo-500 dark:text-indigo-400"
                        />
                      ) : (
                        <User
                          size={14}
                          className="text-purple-500 dark:text-purple-400"
                        />
                      )}
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {chat.type === "question" ? "AI Interviewer" : "You"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {chat.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeInterview;
