import Resume from "../models/Resume.js";
import Student from "../models/Student.js";
import Application from "../models/Application.js";
import JobOpening from "../models/JobOpening.js";
import { streamDeepSeekResponse } from "../utils/deepseek.js";
import { beginSse, sendSseError, sendSseEvent } from "../utils/sseResponse.js";
import { resumeFormatPrompt } from "../prompts/interview.js";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import logger from "../utils/logger.js";
import { success, error } from "../utils/apiResponse.js";

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

  beginSse(res);
  let clientDisconnected = false;
  req.on("close", () => { clientDisconnected = true; });

  try {
    for await (const chunk of streamDeepSeekResponse(prompt)) {
      if (clientDisconnected) break;
      sendSseEvent(res, { type: "content", content: chunk });
    }
    if (!clientDisconnected) {
      sendSseEvent(res, { type: "done" });
      res.end();
    }
  } catch (error) {
    logger.error({ error: error.message }, "流式格式化简历失败");
    if (!clientDisconnected) sendSseError(res, "简历格式化失败");
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
    success(res, {
      resumes: resumes.map((resume) => ({
        ...resume,
        isDefault: Boolean(defaultResumeId && resume._id.equals(defaultResumeId)),
      })),
    });
  } catch (err) {
    logger.error({ err }, "获取简历列表失败");
    error(res, "获取简历列表失败");
  }
};

export const setDefaultResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id);
    if (!resume) return error(res, "简历不存在或已归档", 404);

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { defaultResumeId: resume._id, $unset: { resumeId: 1 } },
      { new: true, runValidators: true }
    );
    success(res, { defaultResumeId: student.defaultResumeId });
  } catch (err) {
    logger.error({ err }, "设置默认简历失败");
    error(res, "设置默认简历失败");
  }
};

export const updateResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id, true);
    if (!resume) return error(res, "简历不存在", 404);
    if (req.body.title !== undefined) resume.title = req.body.title.trim();
    await resume.save();
    success(res, { resume });
  } catch (err) {
    logger.error({ err }, "更新简历失败");
    error(res, "更新简历失败");
  }
};

export const archiveResume = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id);
    if (!resume) return error(res, "简历不存在或已归档", 404);

    resume.isArchived = true;
    await resume.save();
    await Student.findOneAndUpdate(
      { _id: req.user.id, defaultResumeId: resume._id },
      { $set: { defaultResumeId: null } },
      { runValidators: true }
    );
    // 归档而非物理删除，确保已投递简历和面试记录可以继续追溯。
    success(res, { message: "简历已归档" });
  } catch (err) {
    logger.error({ err }, "归档简历失败");
    error(res, "归档简历失败");
  }
};

export const saveResumeText = async (req, res) => {
  try {
    const resume = await getResumeForStudent(req.params.id, req.user.id, true);
    if (!resume) return error(res, "简历不存在", 404);
    const { text } = req.body;
    if (typeof text !== "string") return error(res, "无效的文本内容", 400);
    resume.text = text.trim();
    resume.textStatus = resume.text ? "ready" : "pending";
    await resume.save();
    success(res, { message: "简历文本已保存" });
  } catch (err) {
    logger.error({ err }, "保存简历文本失败");
    error(res, "保存简历文本失败");
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await findAccessibleResume(req, req.params.id, true);
    if (!resume) return error(res, "简历不存在", 404);
    success(res, { resume });
  } catch (err) {
    logger.error({ err }, "获取简历失败");
    error(res, "服务器错误");
  }
};

export const getResumeTextById = async (req, res) => {
  try {
    const resume = await findAccessibleResume(req, req.params.id, true);
    if (!resume) return error(res, "简历不存在", 404);
    if (resume.text) return success(res, { text: resume.text });

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
        return error(res, "无法解析该 PDF 文件", 422);
      }
    } else if (resume.fileType === "docx" || resume.fileType === "doc") {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      return error(res, "不支持的文件格式", 400);
    }

    const trimmed = text.trim();
    resume.text = trimmed;
    resume.textStatus = trimmed ? "ready" : "failed";
    await resume.save();
    success(res, { text: trimmed });
  } catch (err) {
    logger.error({ err }, "提取简历文本失败");
    error(res, "提取简历文本失败");
  }
};
