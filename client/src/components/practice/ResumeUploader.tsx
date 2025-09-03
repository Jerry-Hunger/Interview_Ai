import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

// ✅ Setup worker correctly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ResumeUploaderProps {
  setSetupData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ setSetupData }) => {
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const extractTextFromPDF = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();

      reader.onload = async () => {
        if (!reader.result) return;
        const typedArray = new Uint8Array(reader.result as ArrayBuffer);

        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content: any = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(" ") + "\n";
        }

        setFileName(file.name);
        setSetupData((prev) => ({ ...prev, resume: fullText.trim() }));
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error extracting PDF:", err);
      alert("Failed to extract text from resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) extractTextFromPDF(file);
          }}
          className="hidden"
          id="resumeUpload"
        />
        <label htmlFor="resumeUpload" className="cursor-pointer w-full">
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"
              />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {fileName ? "Replace Resume (PDF)" : "Upload your resume (PDF)"}
            </p>
            {loading && (
              <p className="text-blue-600 text-xs">Extracting text...</p>
            )}
            {fileName && !loading && (
              <p className="text-green-600 text-xs">✔ Uploaded: {fileName}</p>
            )}
          </div>
        </label>
      </div>
    </div>
  );
};

export default ResumeUploader;
