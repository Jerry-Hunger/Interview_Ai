import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, User } from "lucide-react";

const ChatWindow = ({ chatHistory }: any) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Auto-scroll to latest chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  return (
    <Card className="col-span-3 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg text-indigo-500 dark:text-indigo-400">
          Chat History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
          {chatHistory.map((chat: any, index: number) => (
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
              <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-200">
                {chat.content}
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;
