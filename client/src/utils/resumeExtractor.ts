import * as pdfjsLib from "pdfjs-dist";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";

// ✅ Tell pdfjs where the worker lives

import mammoth from "mammoth";

// ✅ Setup pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const extractPdfText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textContent = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    textContent += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return textContent.trim();
};

const extractDocxText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.trim();
};

// 🔹 Extract text based on file type
export const extractResumeText = async (file: File): Promise<string> => {
  if (file.type === "application/pdf") return extractPdfText(file);
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    return extractDocxText(file);
  }
  throw new Error("Unsupported file format. Please upload PDF or DOCX.");
};

// 🔹 Open file dialog and return resume data
export const pickResumeFile = (): Promise<{ file: File; text: string }> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return reject(new Error("No file selected"));

      try {
        const text = await extractResumeText(file);
        resolve({ file, text });
      } catch (error) {
        reject(error);
      }
    };

    input.click();
  });
};
