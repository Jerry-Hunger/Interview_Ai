import React, { useState, useEffect } from "react";
import MarkdownText from "./MarkdownText";
import axiosInstance from "@/utils/axiosInstance";
import { X } from "lucide-react";

interface FormattedResumeModalProps {
  resumeText?: string;
  resumeId?: string;
  onClose: () => void;
}

const FormattedResumeModal: React.FC<FormattedResumeModalProps> = ({
  resumeText: resumeTextProp,
  resumeId,
  onClose,
}) => {
  const [displayedContent, setDisplayedContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    let xhr: XMLHttpRequest | null = null;

    const startStream = (text: string) => {
      if (cancelled) return;

      xhr = new XMLHttpRequest();
      xhr.open("POST", `${import.meta.env.VITE_API_URL}/resume/format-resume-stream`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);

      let accumulated = "";

      xhr.onprogress = () => {
        if (cancelled || !xhr) return;
        const newData = xhr.responseText.slice(accumulated.length);
        accumulated += newData;

        const lines = newData.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setError(data.error);
                return;
              }
              if (data.done) {
                setIsStreaming(false);
                return;
              }
              if (data.content) {
                setDisplayedContent((prev) => prev + data.content);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      };

      xhr.onerror = () => {
        if (!cancelled) {
          setError("简历格式化失败");
        }
      };

      xhr.onload = () => {
        if (!cancelled && xhr && xhr.status !== 200) {
          setError("简历格式化失败");
        }
      };

      xhr.send(JSON.stringify({ resumeText: text }));
    };

    const fetchAndStream = async () => {
      let text = resumeTextProp;

      if (!text && resumeId) {
        try {
          const textRes = await axiosInstance.get(`/resume/${resumeId}/text`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          text = textRes.data.text || "";
        } catch {
          if (!cancelled) {
            setError("无法获取简历内容");
          }
          return;
        }
      }

      if (!text) {
        if (!cancelled) {
          setError("无法提取简历内容");
        }
        return;
      }

      startStream(text);
    };

    fetchAndStream();

    return () => {
      cancelled = true;
      if (xhr) xhr.abort();
    };
  }, [resumeTextProp, resumeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl bg-white dark:bg-[#1a1c29] border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1c29] border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                📄 简历预览
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {error ? "处理失败" : isStreaming ? "AI 正在整理简历结构..." : "格式化已完成"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-base font-medium">{error}</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownText content={displayedContent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormattedResumeModal;
