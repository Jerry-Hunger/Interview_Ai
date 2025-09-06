import React, { useState, useEffect } from "react";
import MarkdownText from "./MarkdownText";
import axiosInstance from "@/utils/axiosInstance";
import { X } from "lucide-react";

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
        console.error("❌ Failed to fetch formatted resume", err);
        setFormattedResume("⚠️ Error loading formatted resume.");
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
            📄 Resume Preview
          </h2>
          {/* Close Button */}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 
             hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
             text-gray-700 dark:text-gray-200 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Extracted and auto-formatted for readability
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 leading-relaxed text-gray-800 dark:text-gray-200">
          {loading ? (
            <p className="text-indigo-500 animate-pulse">
              ⏳ Formatting resume...
            </p>
          ) : (
            <MarkdownText content={formattedResume} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FormattedResumeModal;
