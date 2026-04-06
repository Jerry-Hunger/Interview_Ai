import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  type: "question" | "answer";
  content: string;
  timestamp: string;
};

type ChatWindowProps = {
  chatHistory: ChatMessage[];
  streamingMessage?: string;
  rounds?: number;
  currentRound?: number;
};

const ChatWindow = ({ chatHistory, streamingMessage, rounds, currentRound }: ChatWindowProps) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, streamingMessage]);

  const renderContent = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-200 mb-2 last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-sm text-gray-900 dark:text-gray-200">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-sm text-gray-900 dark:text-gray-200">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-900 dark:text-gray-200">{children}</li>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <Card className="col-span-3 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-indigo-500 dark:text-indigo-400">
          对话历史
        </CardTitle>
        {rounds && rounds > 1 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {currentRound || 1}轮/{rounds}轮
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[calc(100vh-16rem)] overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
          {chatHistory.map((chat: ChatMessage, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-2xl shadow-sm transition-all duration-200 ${
                chat.type === "question"
                  ? "bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-[#23263A] dark:to-[#1C1E2C] border border-indigo-200 dark:border-indigo-700"
                  : "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-[#23263A] dark:to-[#1C1E2C] border border-purple-200 dark:border-purple-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {chat.type === "question" ? (
                  <MessageCircle
                    size={16}
                    className="text-indigo-500 dark:text-indigo-400"
                  />
                ) : (
                  <User
                    size={16}
                    className="text-purple-500 dark:text-purple-400"
                  />
                )}
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {chat.type === "question" ? "AI Interviewer" : "You"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {chat.timestamp}
                </span>
              </div>
              {renderContent(chat.content)}
            </div>
          ))}
          {chatHistory.length === 0 && streamingMessage && (
            <div className="p-4 rounded-2xl shadow-sm bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-[#23263A] dark:to-[#1C1E2C] border border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle
                  size={16}
                  className="text-indigo-500 dark:text-indigo-400"
                />
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  AI Interviewer
                </span>
              </div>
              {renderContent(streamingMessage)}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
