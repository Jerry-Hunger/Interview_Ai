import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import aiInterviewer from "@/assets/ai_interviewer.jpg";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Play,
  Pause,
  Mic,
  MicOff,
  Send,
  Camera,
  CameraOff,
} from "lucide-react";
import ChatWindow from "./ChatWindow";

type SetupData = {
  resume: string;
  role: string;
  difficulty: string;
  roundType: string;
  topic: string;
  rounds: number;
  questionsPerRound: number;
  currentRound?: number;
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

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [index: number]: { transcript: string };
  }[];
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type ToastFunc = {
  (props: { title: string; description?: string; variant?: string }): void;
};

type PracticeInterviewProps = {
  setupData: SetupData;
  interviewState: InterviewState;
  setInterviewState: React.Dispatch<React.SetStateAction<InterviewState>>;
  handleAnswerSubmit: () => void;
  handleEndInterview: () => void;
  handleQuit: () => void;
  toast: ToastFunc;
  isLoading?: boolean;
  interviewPhase?: "answering" | "ended";
  streamingMessage?: string;
  currentRound?: number;
};

const PracticeInterview = ({
  setupData,
  interviewState,
  setInterviewState,
  handleAnswerSubmit,
  handleEndInterview,
  handleQuit,
  toast,
  isLoading = false,
  interviewPhase = "answering",
  streamingMessage,
  currentRound = 1,
}: PracticeInterviewProps) => {
  const currentQuestion = interviewState.question;
  const isLastQuestion =
    interviewState.currentQuestion >= interviewState.totalQuestions;
  const [fullTranscript, setFullTranscript] = useState("");
  const [speaking, setSpeaking] = useState({
    ai: false,
    candidate: false,
  });

  // Web Speech API
  const SpeechRecognitionConstructor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

  let recognition: SpeechRecognitionInstance | null = null;

  if (SpeechRecognitionConstructor) {
    recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
  }

  const toggleMic = () => {
    if (!recognition) {
      toast({
        title: "不支持",
        description: "您的浏览器不支持语音识别功能。",
        variant: "destructive",
      });
      return;
    }

    if (interviewState.isMicOn) {
      // 🔴 Stop recording
      recognition.stop();

      // Save transcript as final answer
      setInterviewState((prev) => ({
        ...prev,
        isMicOn: false,
        answer: fullTranscript.trim(),
      }));

      if (fullTranscript.trim()) {
        handleAnswerSubmit();
      }

      setFullTranscript(""); // reset
    } else {
      // 🎤 Start recording
      setFullTranscript("");
      recognition.start();

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let newTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          // ✅ only append *final* transcripts (not interim)
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }

        if (newTranscript) {
          setFullTranscript((prev) => (prev + " " + newTranscript).trim());
          setInterviewState((prev) => ({
            ...prev,
            answer: (prev.answer + " " + newTranscript).trim(),
          }));
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("语音识别错误：", event.error);
        toast({
          title: "麦克风错误",
          description: event.error,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        // ✅ restart automatically until mic is off
        if (interviewState.isMicOn) recognition?.start();
      };

      setInterviewState((prev) => ({ ...prev, isMicOn: true }));
    }
  };
  useEffect(() => {
    if (interviewState.question) {
      // Cancel previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(interviewState.question);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1.2; // slightly higher pitch (more natural female)
      utterance.volume = 1;

      // Pick a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) =>
        v.name.toLowerCase().includes("female")
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      // Glow effect when speaking
      utterance.onstart = () => setSpeaking((prev) => ({ ...prev, ai: true }));
      utterance.onend = () => setSpeaking((prev) => ({ ...prev, ai: false }));

      window.speechSynthesis.speak(utterance);
    }
  }, [interviewState.question]);

  useEffect(() => {
    if (interviewState.isMicOn) {
      setSpeaking((prev) => ({ ...prev, candidate: true }));
    } else {
      setSpeaking((prev) => ({ ...prev, candidate: false }));
    }
  }, [interviewState.isMicOn]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#181A2A]">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6 dark:bg-[#181A2A]">
        <div className="grid grid-cols-12 h-[calc(100vh-8rem)] dark:bg-[#181A2A]">
          {/* Left Sidebar - Metadata */}
          <Card className="col-span-3 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-indigo-500 dark:text-indigo-400">
                面试环节
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  职位
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {setupData.role}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900 dark:text-white">
                  面试类型
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {setupData.roundType === "behavioral" ? "行为面试" :
                    setupData.roundType === "technical" ? "技术面试" :
                    setupData.roundType === "system-design" ? "系统设计" :
                    setupData.roundType === "coding" ? "编程挑战" :
                    setupData.roundType === "mixed" ? "综合面试" :
                    setupData.roundType}
                 </p>
               </div>
               <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-white">
                    当前问题
                  </Label>
                  <div className="flex items-center justify-center gap-1">
                    {Array.from({ length: interviewState.totalQuestions }, (_, i) => {
                      const questionNum = i + 1;
                      const isCompleted = questionNum < interviewState.currentQuestion;
                      const isCurrent = questionNum === interviewState.currentQuestion;
                      const isLastQuestion = interviewPhase === "ended" && questionNum === interviewState.totalQuestions;

                      return (
                        <div
                          key={`bar-${questionNum}`}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500"
                              : isCurrent || isLastQuestion
                              ? "bg-indigo-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    {interviewPhase === "ended" 
                      ? `已完成 ${interviewState.totalQuestions} / ${interviewState.totalQuestions} 个问题`
                      : `第 ${Math.min(interviewState.currentQuestion, interviewState.totalQuestions)} / ${interviewState.totalQuestions} 个问题`}
                  </p>
                </div>
               <Separator />
               <div className="space-y-2">
                 <Label className="text-sm font-medium text-gray-900 dark:text-white">
                   当前问题
                 </Label>
                 <div className="p-3 bg-indigo-50 dark:bg-[#23263A] rounded-lg text-sm text-gray-900 dark:text-white">
                   <ReactMarkdown
                     remarkPlugins={[remarkGfm]}
                     components={{
                       p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                       strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                       ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                       ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                     }}
                   >
                     {streamingMessage || currentQuestion}
                   </ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Center - Interview Windows */}
          <div className="col-span-6 space-y-6">
            <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
              <CardContent className="p-4 grid grid-cols-2 gap-6 justify-items-center">
                {/* AI Interviewer Window */}
                <div
                  className={`flex flex-col items-center ${
                    speaking.ai
                      ? "border-indigo-500 shadow-lg shadow-indigo-400 animate-pulse"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="w-48 h-48 bg-gray-200 dark:bg-[#23263A] rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                    <img
                      src={aiInterviewer}
                      alt="AI Interviewer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                    AI面试官
                  </p>
                </div>

                {/* Candidate Window */}
                <div
                  className={`flex flex-col items-center ${
                    speaking.candidate
                      ? "border-purple-500 shadow-lg shadow-purple-400 animate-pulse"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
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
                          开启摄像头
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                      onClick={() =>
                        setInterviewState((prev) => ({
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
                    面试者
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Answer Input */}
            {interviewPhase === "ended" ? (
              <Card className="shadow-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <CardContent className="py-8 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    面试已结束
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    您已完成所有面试问题，点击下方按钮查看面试反馈
                  </p>
                  <Button
                    onClick={handleEndInterview}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg px-8 py-3 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        生成中...
                      </>
                    ) : (
                      <>
                        <FileText size={18} className="mr-2" />
                        查看面试反馈
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-indigo-500 dark:text-indigo-400">
                    <span className="flex items-center gap-2">
                      <FileText size={20} />
                      您的回答
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={
                          interviewState.isRecording ? "destructive" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setInterviewState((prev) => ({
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
                        {interviewState.isRecording ? "录制中..." : "录制"}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="在此输入您的回答或使用语音录制..."
                    value={interviewState.answer}
                    onChange={(e) =>
                      setInterviewState((prev) => ({
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
                        onClick={toggleMic}
                        className="text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
                      >
                        {interviewState.isMicOn ? (
                          <Mic size={14} />
                        ) : (
                          <MicOff size={14} />
                        )}
                      </Button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        麦克风{" "}
                        {interviewState.isMicOn ? "开启（聆听中...）" : "关闭"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleQuit}
                        className="border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        退出面试
                      </Button>
                      <Button
                        onClick={handleAnswerSubmit}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg"
                        disabled={!interviewState.answer.trim() || isLoading}
                      >
                        <Send size={14} className="mr-2" />
                        {isLastQuestion ? "提交最后一题" : "提交回答"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Chat History */}
          {/* <div className="col-span-4"> */}
          <ChatWindow 
            chatHistory={interviewState.chatHistory} 
            streamingMessage={streamingMessage}
            rounds={setupData.rounds}
            currentRound={currentRound}
          />
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default PracticeInterview;
