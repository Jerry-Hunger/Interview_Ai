import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/utils/axiosInstance";

type ResumeUploaderProps = {
  handleDataChanged: (data: { resumeText: string; resumeId?: string; fileUrl?: string; fileName?: string }) => void;
  onUploadSuccess?: (data: { resumeId: string; fileUrl: string; fileName: string }) => void;
  initialResumeText?: string;
};

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ handleDataChanged, onUploadSuccess, initialResumeText }) => {
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  const handleDataChange = useCallback((data: { resumeText: string; resumeId?: string; fileUrl?: string; fileName?: string }) => {
    handleDataChanged(data);
  }, [handleDataChanged]);

  const cancelRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalOperationsRef = useRef<number>(0);
  const completedOperationsRef = useRef<number>(0);

  const resetStates = useCallback(() => {
    setLoading(false);
    setStatus("");
    setProgress(0);
    setEstimatedTime(0);
    cancelRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    completedOperationsRef.current = 0;

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const opsPerSecond = completedOperationsRef.current / elapsed;
      const remainingOps = totalOperationsRef.current - completedOperationsRef.current;

      if (opsPerSecond > 0) {
        const remainingSeconds = Math.round(remainingOps / opsPerSecond);
        setEstimatedTime(remainingSeconds);
      }
    }, 1000);
  }, []);

  const updateProgress = useCallback((current: number, total: number, stageWeight: number) => {
    const baseProgress = stageWeight;
    const stageProgress = (current / total) * (100 - stageWeight);
    const newProgress = Math.round(baseProgress + stageProgress);
    completedOperationsRef.current = current;
    setProgress(newProgress);
  }, []);

  const handleCancel = useCallback(() => {
    cancelRef.current = true;
    setStatus("已取消");
    setTimeout(resetStates, 1500);
  }, [resetStates]);

  const getPdfjs = async () => {
    const pdfjsLib = await import("pdfjs-dist");
    const pdfjsWorker = (await import("pdfjs-dist/build/pdf.worker?url")).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    return pdfjsLib;
  };

  const pdfPageToImage = async (
    pdf: import("pdfjs-dist").PDFDocumentProxy,
    pageNumber: number,
    scale: number = 2.0
  ): Promise<string> => {
    if (cancelRef.current) throw new Error("Cancelled");

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not get canvas context");
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      canvas: canvas,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL("image/png");
  };

  const pdfToImages = async (
    pdfjsLib: typeof import("pdfjs-dist"),
    file: File,
    totalPages: number
  ): Promise<string[]> => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          if (!reader.result) {
            reject(new Error("读取文件失败"));
            return;
          }

          if (cancelRef.current) {
            reject(new Error("已取消"));
            return;
          }

          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

          const images: string[] = [];

          for (let i = 1; i <= totalPages; i++) {
            if (cancelRef.current) {
              reject(new Error("已取消"));
              return;
            }

            setStatus(`正在转换第 ${i}/${totalPages} 页...`);
            updateProgress(i, totalPages, 0);
            const imageData = await pdfPageToImage(pdf, i);
            images.push(imageData);
          }

          resolve(images);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.readAsArrayBuffer(file);
    });
  };

  const extractTextByOCR = async (images: string[]): Promise<string> => {
    const Tesseract = await import("tesseract.js");
    let fullText = "";
    const totalImages = images.length;

    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const msg = args[0];
      if (typeof msg === "string" && msg.includes("Parameter not found")) return;
      originalWarn.apply(console, args as Parameters<typeof originalWarn>);
    };

    try {
      for (let i = 0; i < totalImages; i++) {
        if (cancelRef.current) throw new Error("Cancelled");

        setStatus(`正在识别第 ${i + 1}/${totalImages} 页...`);

        const result = await Tesseract.recognize(images[i], "eng+chi_sim", {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text" && !cancelRef.current) {
              const overallProgress = 30 + (i / totalImages) * 70 + (m.progress * 70 / totalImages);
              setProgress(Math.round(overallProgress));
            }
          },
        });

        updateProgress(i + 1, totalImages, 30);

        if (cancelRef.current) throw new Error("Cancelled");

        fullText += result.data.text + "\n\n";
      }
    } finally {
      console.warn = originalWarn;
    }

    return fullText.trim();
  };

  const extractTextFromPDF = async (file: File, resumeId?: string, fileUrl?: string) => {
    cancelRef.current = false;
    setLoading(true);
    setStatus("正在读取 PDF...");
    setProgress(0);

    const pdfjsLib = await getPdfjs();

    const reader = new FileReader();

    reader.onload = async () => {
      if (!reader.result) {
        resetStates();
        return;
      }

      if (cancelRef.current) {
        resetStates();
        return;
      }

      const typedArray = new Uint8Array(reader.result as ArrayBuffer);

      try {
        setStatus("正在检查 PDF 内容...");
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        const totalPages = pdf.numPages;
        totalOperationsRef.current = totalPages;

        let fullText = "";
        for (let i = 1; i <= totalPages; i++) {
          if (cancelRef.current) {
            resetStates();
            return;
          }
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => ("str" in item ? item.str : ""));
          fullText += strings.join(" ") + "\n";
        }

        const trimmedText = fullText.trim();

        if (!trimmedText) {
          setStatus("未检测到文字，开始转换图片...");
          startTimer();

          try {
            const images = await pdfToImages(pdfjsLib, file, totalPages);

            if (cancelRef.current) {
              resetStates();
              return;
            }

            const ocrText = await extractTextByOCR(images);

            if (cancelRef.current) {
              resetStates();
              return;
            }

            setStatus("处理完成！");
            setProgress(100);
            setFileName(file.name);
            await handleDataChange({ resumeText: ocrText, resumeId, fileUrl, fileName: file.name });

            setTimeout(resetStates, 1000);
          } catch (ocrErr: unknown) {
            const err = ocrErr as { message?: string };
            if (err.message === "已取消" || err.message === "Cancelled") {
              setStatus("已取消");
            } else {
              console.error("OCR 失败:", ocrErr);
              setStatus("识别失败");
              alert("无法识别简历文字，请尝试其他文件或转换为 DOCX 格式。");
            }
            resetStates();
          }
        } else {
          setStatus("处理完成！");
          setProgress(100);
          setFileName(file.name);
          await handleDataChange({ resumeText: trimmedText, resumeId, fileUrl, fileName: file.name });
          setTimeout(resetStates, 1000);
        }
      } catch (pdfErr) {
        console.error("PDF 解析失败:", pdfErr);
        setStatus("正在转换为图片进行识别...");

        try {
          const typedArray2 = new Uint8Array(reader.result as ArrayBuffer);
          const pdf2 = await pdfjsLib.getDocument({ data: typedArray2 }).promise;
          const totalPages = pdf2.numPages;
          totalOperationsRef.current = totalPages;

          startTimer();
          const images = await pdfToImages(pdfjsLib, file, totalPages);

          if (cancelRef.current) {
            resetStates();
            return;
          }

          const ocrText = await extractTextByOCR(images);

          if (cancelRef.current) {
            resetStates();
            return;
          }

          setStatus("处理完成！");
          setProgress(100);
          setFileName(file.name);
          await handleDataChange({ resumeText: ocrText, resumeId, fileUrl, fileName: file.name });
          setTimeout(resetStates, 1000);
        } catch (ocrErr: unknown) {
          const err = ocrErr as { message?: string };
          if (err.message === "已取消" || err.message === "Cancelled") {
            setStatus("已取消");
          } else {
            console.error("OCR 失败:", pdfErr);
            setStatus("识别失败");
            alert("无法识别简历文字，请尝试其他文件或转换为 DOCX 格式。");
          }
          resetStates();
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const extractTextFromDocx = async (file: File, resumeId?: string, fileUrl?: string) => {
    cancelRef.current = false;
    setLoading(true);
    setStatus("正在提取 DOCX 文字...");
    setProgress(50);

    const mammoth = await import("mammoth");

    try {
      const reader = new FileReader();

      reader.onload = async () => {
        if (!reader.result) {
          resetStates();
          return;
        }

        if (cancelRef.current) {
          resetStates();
          return;
        }

        const typedArray = new Uint8Array(reader.result as ArrayBuffer);

        try {
          const result = await mammoth.extractRawText({ arrayBuffer: typedArray });
          setStatus("处理完成！");
          setProgress(100);
          setFileName(file.name);
          await handleDataChange({ resumeText: result.value.trim(), resumeId, fileUrl, fileName: file.name });
          setTimeout(resetStates, 1000);
        } catch (err) {
          console.error("DOCX 提取失败:", err);
          setStatus("提取失败");
          alert("无法提取简历文字。");
          resetStates();
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("DOCX 读取失败:", err);
      setStatus("读取失败");
      alert("无法读取文件。");
      resetStates();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetStates();

    const fileType = file.name.toLowerCase();
    const validExtensions = [".pdf", ".docx", ".doc"];
    const hasValidExtension = validExtensions.some(ext => fileType.endsWith(ext));

    if (!hasValidExtension) {
      alert("不支持的文件格式，请上传 PDF 或 DOCX 文件。");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("文件大小不能超过 5MB");
      return;
    }

    setLoading(true);
    setStatus("正在上传...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await axiosInstance.post("/upload/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (uploadResponse.data.success) {
        const resumeData = uploadResponse.data.resume;

        if (onUploadSuccess) {
          onUploadSuccess({
            resumeId: resumeData.id,
            fileUrl: uploadResponse.data.url,
            fileName: resumeData.fileName,
          });
        }

        setStatus("正在提取文字...");

        if (fileType.endsWith(".pdf")) {
          await extractTextFromPDF(file, resumeData.id, uploadResponse.data.url);
        } else {
          await extractTextFromDocx(file, resumeData.id, uploadResponse.data.url);
        }
      }
    } catch (err) {
      console.error("上传失败:", err);
      alert("上传失败，请稍后重试");
      resetStates();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="resumeUpload"
          disabled={loading}
        />
        <label
          htmlFor="resumeUpload"
          className={`cursor-pointer w-full ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              className="w-10 h-10 text-gray-400 dark:text-gray-500"
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
            <p className={`text-sm ${fileName ? "text-gray-600 dark:text-gray-300" : initialResumeText ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}`}>
              {fileName ? "替换简历 (PDF/DOCX)" : initialResumeText ? "已加载简历，可重新上传" : "上传简历 (PDF/DOCX)"}
            </p>
            {!loading && !status && (
              <p className="text-xs text-gray-400">支持扫描件 PDF、图片和 DOCX 文件</p>
            )}
            {loading && !status.includes("完成") && !status.includes("取消") && (
              <p className="text-blue-600 dark:text-blue-400 text-xs animate-pulse">{status}</p>
            )}
            {fileName && !loading && status === "" && (
              <p className="text-green-600 dark:text-green-400 text-xs">已上传: {fileName}</p>
            )}
          </div>
        </label>
      </div>

      {loading && (
        <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {status}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-7 text-xs text-red-500 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-300"
            >
              取消
            </Button>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {progress < 100 ? (
                estimatedTime > 0 ? (
                  <span>预计剩余 {estimatedTime} 秒</span>
                ) : (
                  <span>计算中...</span>
                )
              ) : (
                <span className="text-green-600 dark:text-green-400">处理完成！</span>
              )}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{progress}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
