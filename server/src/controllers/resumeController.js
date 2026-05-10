import Resume from "../models/Resume.js";
import { streamDeepSeekResponse } from "../utils/deepseek.js";
import { resumeFormatPrompt } from "../prompts/interview.js";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import logger from "../utils/logger.js";

export const formatResumeStream = async (req, res) => {
  const { resumeText } = req.body;

  const prompt = resumeFormatPrompt(resumeText);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    for await (const chunk of streamDeepSeekResponse(prompt)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    logger.error({ error: error.message }, "流式格式化简历失败");
    res.write(`data: ${JSON.stringify({ error: "简历格式化失败" })}\n\n`);
    res.end();
  }
};

export const saveResumeText = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "简历不存在" });
    }
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "无效的文本内容" });
    }
    resume.text = text.trim();
    await resume.save();
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "保存简历文本失败");
    res.status(500).json({ error: "保存简历文本失败" });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "简历不存在" });
    }
    res.json(resume);
  } catch (err) {
    logger.error({ err }, "获取简历失败");
    res.status(500).json({ error: "服务器错误" });
  }
};

export const getResumeTextById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "简历不存在" });
    }

    if (resume.text) {
      return res.json({ text: resume.text });
    }

    const fileUrl = resume.fileUrl;
    const fileType = resume.fileType;

    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    let text = "";

    if (fileType === "pdf") {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        const textParts = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => ("str" in item ? item.str : ""));
          textParts.push(strings.join(" "));
        }
        text = textParts.join("\n");
      } catch (pdfErr) {
        logger.error({ err: pdfErr }, "PDF 解析失败");
        return res.status(422).json({ error: "无法解析该 PDF 文件" });
      }
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: "不支持的文件格式" });
    }

    const trimmed = text.trim();
    if (trimmed) {
      resume.text = trimmed;
      await resume.save();
    }

    res.json({ text: trimmed });
  } catch (err) {
    logger.error({ err }, "提取简历文本失败");
    res.status(500).json({ error: "提取简历文本失败" });
  }
};
