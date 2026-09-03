import Resume from "../models/Resume.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import JobOpening from "../models/JobOpening.js";
import { streamDeepSeekResponse } from "../utils/deepseek.js";
import { resumeFormatPrompt } from "../prompts/interview.js";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import logger from "../utils/logger.js";

const getResumeForStudent = (resumeId, studentId, includeArchived = false) => {
  const filter = { _id: resumeId, studentId, deletedAt: null };
  if (!includeArchived) filter.isArchived = { $ne: true };
  return Resume.findOne(filter);
};

const canCompanyAccessResume = async (companyId, resumeId) => {
  const jobs = await JobOpening.find({ companyId }).select("_id").lean();
  if (jobs.length === 0) return false;
  return Boolean(await Application.exists({
    jobId: { $in: jobs.map((job) => job._id) },
    resumeId,
  }));
};

const findAccessibleResume = async (req, resumeId, includeArchived = false) => {
  const resume = await Resume.findById(resumeId);
  if (!resume || resume.deletedAt || (!includeArchived && resume.isArchived)) return null;

  if (req.user.role === "student") {
    return resume.studentId.equals(req.user.id) ? resume : null;
  }

  return (await canCompanyAccessResume(req.user.id, resume._id)) ? resume : null;
};

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

export const listMyResumes = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const filter = { studentId: req.user.id, deletedAt: null };
    if (!includeArchived) filter.isArchived = { $ne: true };
    const resumes = await Resume.find(filter).sort({ updatedAt: -1 }).lean();
    const student = await Student.findById(req.user.id).select("defaultResumeId resumeId").lean();
    const defaultResumeId = student?.defaultResumeId || student?.resumeId || null;
    res.json({
      resumes: resumes.map((resume) => ({
        ...resume,
        isDefault: Boolean(defaultResumeId && resume._id.equals(defaultResumeId)),
      })),
    });
  } catch (err) {
    logger.error({ err }, "获取简历列表失败");
    res.status(500).json({ error: "获取简历列表失败" });
  }
};

export const setDefaultResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: "简历不存在或已归档" });

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { defaultResumeId: resume._id, $unset: { resumeId: 1 } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, defaultResumeId: student.defaultResumeId });
  } catch (err) {
    logger.error({ err }, "设置默认简历失败");
    res.status(500).json({ error: "设置默认简历失败" });
  }
};

export const updateResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id, true);
    if (!resume) return res.status(404).json({ error: "简历不存在" });
    if (req.body.title !== undefined) resume.title = req.body.title.trim();
    await resume.save();
    res.json({ success: true, resume });
  } catch (err) {
    logger.error({ err }, "更新简历失败");
    res.status(500).json({ error: "更新简历失败" });
  }
};

export const archiveResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id);
    if (!resume) return res.status(404).json({ error: "简历不存在或已归档" });

    resume.isArchived = true;
    await resume.save();
    await Student.findOneAndUpdate(
      { _id: req.user.id, defaultResumeId: resume._id },
      { $set: { defaultResumeId: null } },
      { runValidators: true }
    );
    // 归档而非物理删除，确保已投递简历和面试记录可以继续追溯。
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "归档简历失败");
    res.status(500).json({ error: "归档简历失败" });
  }
};

export const saveResumeText = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id, true);
    if (!resume) return res.status(404).json({ error: "简历不存在" });
    const { text } = req.body;
    if (typeof text !== "string") return res.status(400).json({ error: "无效的文本内容" });
    resume.text = text.trim();
    resume.textStatus = resume.text ? "ready" : "pending";
    await resume.save();
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "保存简历文本失败");
    res.status(500).json({ error: "保存简历文本失败" });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await findAccessibleResume(req, req.params.id, true);
    if (!resume) return res.status(404).json({ error: "简历不存在" });
    res.json(resume);
  } catch (err) {
    logger.error({ err }, "获取简历失败");
    res.status(500).json({ error: "服务器错误" });
  }
};

export const getResumeTextById = async (req, res) => {
  try {
    const resume = await findAccessibleResume(req, req.params.id, true);
    if (!resume) return res.status(404).json({ error: "简历不存在" });
    if (resume.text) return res.json({ text: resume.text });

    const response = await axios.get(resume.fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    let text = "";

    if (resume.fileType === "pdf") {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const textParts = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textParts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
        }
        text = textParts.join("\n");
      } catch (pdfErr) {
        logger.error({ err: pdfErr }, "PDF 解析失败");
        resume.textStatus = "failed";
        await resume.save();
        return res.status(422).json({ error: "无法解析该 PDF 文件" });
      }
    } else if (resume.fileType === "docx" || resume.fileType === "doc") {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      return res.status(400).json({ error: "不支持的文件格式" });
    }

    const trimmed = text.trim();
    resume.text = trimmed;
    resume.textStatus = trimmed ? "ready" : "failed";
    await resume.save();
    res.json({ text: trimmed });
  } catch (err) {
    logger.error({ err }, "提取简历文本失败");
    res.status(500).json({ error: "提取简历文本失败" });
  }
};
