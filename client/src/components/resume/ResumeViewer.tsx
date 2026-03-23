import React, { useState, useEffect } from "react";
import MarkdownText from "./MarkdownText";
import axiosInstance from "@/utils/axiosInstance";
import { X, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FormattedResumeModalProps {
  resumeText: string;
  onClose: () => void;
}

const FormattedResumeModal: React.FC<FormattedResumeModalProps> = ({
  resumeText,
  onClose,
}) => {
  const [formattedResume, setFormattedResume] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFormattedResume = async () => {
      try {
        const res = await axiosInstance.post("/resume/format-resume", {
          resumeText,
        });
        const data = await res.data;
        setFormattedResume(data.formatted);
      } catch (err) {
        console.error("❌ 获取格式化简历失败", err);
        setFormattedResume("⚠️ 加载格式化简历时出错。");
      } finally {
        setLoading(false);
      }
    };

    fetchFormattedResume();
  }, [resumeText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl bg-white dark:bg-[#1a1c29] border border-gray-200 dark:border-gray-700 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1a1c29] border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📄 简历预览
          </h2>
          {/* Close Button */}

          <button
            onClick={onClose}
            className="cursor-pointer absolute top-4 right-4 p-2 rounded-full bg-gray-200 
             hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
             text-gray-700 dark:text-gray-200 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? "正在处理中，请稍候..." : "已提取并自动格式化以便于阅读"}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 leading-relaxed text-gray-800 dark:text-gray-200">
          {loading ? (
            <div className="space-y-3 py-8">
              <div className="flex items-center justify-center gap-2 text-indigo-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">正在格式化简历...</span>
              </div>
              <Progress value={undefined} className="w-full [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500 [&>div]:animate-pulse" />
              <p className="text-xs text-center text-gray-400">AI 正在整理您的简历结构</p>
            </div>
          ) : (
            <MarkdownText content={formattedResume} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FormattedResumeModal;
