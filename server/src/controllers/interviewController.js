import { generateDeepSeekResponse, streamDeepSeekResponse } from "../utils/deepseek.js";
import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";
import Application from "../models/Application.js";
import logger from "../utils/logger.js";
import {
  startInterviewFirstRound,
  startInterviewContinuationRound,
  respondNormal,
  respondLastQuestion,
  concludeChunk,
  concludeFinal,
} from "../prompts/interview.js";
import { getPagination, toPaginationMeta } from "../utils/pagination.js";

// 统一的面试结果判定：匹配"评估结论"或"结果"关键词
const RESULT_PATTERN = /(?:评估结论|结果)\s*[：:]\s*(不?通过)/;
const parseResultFromFeedback = (feedbackText) => {
  for (const line of feedbackText.split("\n")) {
    const match = line.match(RESULT_PATTERN);
    if (match) return match[1] === "不通过" ? "failure" : "success";
  }
  return "success";
};

const createRequestError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * 将企业面试与申请、职位和投递简历绑定，防止客户端伪造关联关系。
 */
const resolveInterviewContext = async ({ studentId, type, resumeId, applicationId, roundNumber }) => {
  if (!resumeId) throw createRequestError("请选择本次面试使用的简历");
  const resume = await Resume.findOne({ _id: resumeId, studentId, deletedAt: null });
  if (!resume) throw createRequestError("所选简历不存在或不属于当前用户", 404);

  if (type === "practice") {
    if (resume.isArchived) throw createRequestError("所选简历已归档");
    return { resume, interviewFields: { resumeId: resume._id } };
  }

  if (type !== "company" || !applicationId || !Number.isInteger(Number(roundNumber))) {
    throw createRequestError("企业面试缺少申请或轮次信息");
  }

  const application = await Application.findOne({ _id: applicationId, candidateId: studentId }).populate("jobId");
  if (!application || !application.jobId) throw createRequestError("申请记录不存在或不属于当前用户", 404);
  if (!application.resumeId?.equals(resume._id)) throw createRequestError("企业面试必须使用投递时选择的简历");

  const normalizedRound = Number(roundNumber);
  const totalRounds = application.jobId.rounds?.length || 0;
  if (
    application.status !== "in-progress" ||
    normalizedRound !== application.currentRound + 1 ||
    normalizedRound > application.approvedThrough ||
    normalizedRound > totalRounds
  ) {
    throw createRequestError("当前轮次尚未由企业开启", 409);
  }

  return {
    resume,
    interviewFields: {
      resumeId: resume._id,
      applicationId: application._id,
      jobId: application.jobId._id,
      roundNumber: normalizedRound,
    },
  };
};

const formatBlock = (block) => {
  let result = "";
  let qCount = 1;
  for (let i = 0; i < block.length; i++) {
    if (block[i].type === "question") {
      result += `问${qCount}：${block[i].content}\n`;
      if (i + 1 < block.length && block[i + 1].type === "answer") {
        result += `答${qCount}：${block[i + 1].content}\n\n`;
        i++;
      }
      qCount++;
    }
  }
  return result.trim();
};

export const startInterview = async (req, res) => {
  const { role, resume, resumeId, applicationId, roundType, topic, difficulty, type, isContinuation, currentRound, totalRounds, previousFeedback, questionsPerRound } =
    req.body;

  try {
    const context = await resolveInterviewContext({
      studentId: req.user.id,
      type,
      resumeId,
      applicationId,
      roundNumber: currentRound,
    });
    const resumeText = context.resume.text || resume;
    if (!resumeText) throw createRequestError("所选简历尚未完成文本提取");
    const prompt = isContinuation && currentRound && totalRounds
      ? startInterviewContinuationRound({ resume: resumeText, role, roundType, topic, difficulty, currentRound, totalRounds, previousFeedback, questionsPerRound })
      : startInterviewFirstRound({ resume: resumeText, role, roundType, topic, difficulty });
    const response = await generateDeepSeekResponse(prompt);
    res.json({ message: response.trim() });
  } catch (error) {
    logger.error({ error: error.message }, "开始面试失败");
    res.status(error.status || 500).json({ error: error.status ? error.message : "AI 响应失败，请稍后重试。" });
  }
};

export const respondToInterviewStream = async (req, res) => {
  const { chatHistory, answer, resume, role, roundType, topic, difficulty, isLastQuestion, currentRound, totalRounds } =
    req.body;

  let prompt;
  if (isLastQuestion) {
    prompt = respondLastQuestion({
      chatHistory,
      answer,
      resume,
      role,
      roundType,
      topic,
      difficulty,
      currentRound,
      totalRounds,
    });
  } else {
    prompt = respondNormal({ chatHistory, answer, resume, role, roundType, topic, difficulty });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let clientDisconnected = false;
  req.on("close", () => { clientDisconnected = true; });

  try {
    for await (const chunk of streamDeepSeekResponse(prompt)) {
      if (clientDisconnected) break;
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    logger.error({ error: error.message }, "流式回答面试失败");
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "AI 响应失败，请稍后重试。" })}\n\n`);
      res.end();
    }
  }
};

export const concludeInterview = async (req, res) => {
  const {
    history = [],
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    difficulty,
    typeOfInterview,
    resumeId,
    applicationId,
    result: clientResult,
    totalRounds,
    currentRound,
  } = req.body;

  const studentId = req.user.id;

  try {
  const context = await resolveInterviewContext({
    studentId,
    type: typeOfInterview,
    resumeId,
    applicationId,
    roundNumber: currentRound || 1,
  });
  const selectedResumeText = context.resume.text || resumeText;
  if (!selectedResumeText) throw createRequestError("所选简历尚未完成文本提取");
  if (clientResult === "quit") {
    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      finalFeedback: "面试已退出，未完成评估。",
      result: "quit",
      type: typeOfInterview,
      ...context.interviewFields,
      difficulty,
      resumeText: selectedResumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });
    await interview.save();
    logger.info({ interviewId: interview._id }, "保存退出面试");
    return res.json({ interview });
  }

  const CHUNK_SIZE = 6; // 每块 3 对问答 (每对2条: question + answer)

  const lastEntry = history[history.length - 1];
  const hasSummary = history.length % 2 === 1 && lastEntry?.type === "question";
  const filteredHistory = hasSummary ? history.slice(0, -1) : history;

  const chunks = [];
  // 按问答对分块，每 3 对为一块（3*2=6条），确保问答对完整性
  for (let i = 0; i < filteredHistory.length; i += CHUNK_SIZE) {
    chunks.push(filteredHistory.slice(i, Math.min(i + CHUNK_SIZE, filteredHistory.length)));
  }

  const feedbacks = await Promise.all(
    chunks.map((chunk, i) => {
      const prompt = concludeChunk({
        chunkIndex: i,
        totalChunks: chunks.length,
        blockContent: formatBlock(chunk),
        roleSummary,
        resumeText: selectedResumeText,
        roundType,
        customTopic,
      });
      return generateDeepSeekResponse(prompt).then((f) => f.trim());
    })
  );

  const finalPrompt = concludeFinal({
    // historyLength 应该是问题数量，而非对话条目数量
    // 对话格式为 [Q1, A1, Q2, A2, ...]，所以问题数 = 条目数 / 2
    historyLength: Math.ceil(filteredHistory.length / 2),
    chunksLength: chunks.length,
    roleSummary,
    difficulty,
    resumeText: selectedResumeText,
    feedbacks,
  });

  const finalFeedback = await generateDeepSeekResponse(finalPrompt);

  const result = parseResultFromFeedback(finalFeedback);

  const interview = new Interview({
    student: studentId,
    chatHistory: history,
    feedbacks,
    finalFeedback,
    result,
    type: typeOfInterview,
    ...context.interviewFields,
    difficulty,
    resumeText: selectedResumeText,
    roleSummary,
    roundType,
    customTopic,
    rounds: totalRounds || 1,
    currentRound: currentRound || 1,
    createdAt: new Date(),
  });
  await interview.save();
  logger.info({ interviewId: interview._id }, "保存面试记录");
  res.json({ interview, feedbacks });
  } catch (error) {
    logger.error({ error: error.message }, "结束面试失败");
    res.status(error.status || 500).json({ error: error.status ? error.message : "生成反馈失败，请稍后重试。" });
  }
};

export const concludeInterviewStream = async (req, res) => {
  try {
    const {
      history = [],
      resumeText,
      roleSummary,
      roundType,
      customTopic,
      difficulty,
      typeOfInterview,
      resumeId,
      applicationId,
      result: clientResult,
      totalRounds,
      currentRound,
    } = req.body;

    const studentId = req.user.id;
    const context = await resolveInterviewContext({
      studentId,
      type: typeOfInterview,
      resumeId,
      applicationId,
      roundNumber: currentRound || 1,
    });
    const selectedResumeText = context.resume.text || resumeText;
    if (!selectedResumeText) throw createRequestError("所选简历尚未完成文本提取");

    if (clientResult === "quit") {
      const interview = new Interview({
        student: studentId,
        chatHistory: history,
        finalFeedback: "面试已退出，未完成评估。",
        result: "quit",
        type: typeOfInterview,
        ...context.interviewFields,
        difficulty,
        resumeText: selectedResumeText,
        roleSummary,
        roundType,
        customTopic,
        rounds: totalRounds || 1,
        currentRound: currentRound || 1,
        createdAt: new Date(),
      });
      await interview.save();
      return res.json({ interview });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let clientDisconnected = false;
    req.on("close", () => { clientDisconnected = true; });

    const CHUNK_SIZE = 6;

    const lastEntry = history[history.length - 1];
    const hasSummary = history.length % 2 === 1 && lastEntry?.type === "question";
    const filteredHistory = hasSummary ? history.slice(0, -1) : history;

    const chunks = [];
    for (let i = 0; i < filteredHistory.length; i += CHUNK_SIZE) {
      chunks.push(filteredHistory.slice(i, Math.min(i + CHUNK_SIZE, filteredHistory.length)));
    }

    const feedbacks = [];
    for (let i = 0; i < chunks.length; i++) {
      if (clientDisconnected) break;
      const prompt = concludeChunk({
        chunkIndex: i,
        totalChunks: chunks.length,
        blockContent: formatBlock(chunks[i]),
        roleSummary,
        resumeText: selectedResumeText,
        roundType,
        customTopic,
      });

      res.write(`[CHUNK_START:${i}]\n`);

      let fullFeedback = "";
      for await (const chunk of streamDeepSeekResponse(prompt)) {
        fullFeedback += chunk;
        res.write(chunk);
      }
      feedbacks.push(fullFeedback.trim());
      res.write(`\n[CHUNK_END:${i}:${Buffer.from(fullFeedback).toString("base64")}]\n`);
    }

    const finalPrompt = concludeFinal({
      historyLength: Math.ceil(filteredHistory.length / 2),
      chunksLength: chunks.length,
      roleSummary,
      difficulty,
      resumeText: selectedResumeText,
      feedbacks,
    });

    res.write("[FINAL_START]\n");

    let fullFinalFeedback = "";
    for await (const chunk of streamDeepSeekResponse(finalPrompt)) {
      fullFinalFeedback += chunk;
      res.write(chunk);
    }

    const result = parseResultFromFeedback(fullFinalFeedback);

    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      feedbacks,
      finalFeedback: fullFinalFeedback,
      result,
      type: typeOfInterview,
      ...context.interviewFields,
      difficulty,
      resumeText: selectedResumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });

    await interview.save();

    const doneMarker = `\n[DONE:${interview._id}:${result}]\n`;
    res.write(doneMarker);
    res.end();
  } catch (error) {
    logger.error({ error: error.message }, "流式结束面试失败");
    if (!res.headersSent) {
      res.status(error.status || 500).json({ error: error.status ? error.message : "生成反馈失败，请稍后重试。" });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "生成反馈失败，请稍后重试。" })}\n\n`);
      res.end();
    }
  }
};

export const getUserInterviews = async (req, res) => {
  try {
    const studentId = req.user.id;
    const pagination = getPagination(req.query);
    logger.info({ studentId }, "获取学生面试记录");
    const filter = { student: studentId };
    const [interviews, total] = await Promise.all([
      Interview.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean(),
      Interview.countDocuments(filter),
    ]);
    res.json({ interviews, pagination: toPaginationMeta(pagination, total) });
  } catch (err) {
    logger.error({ err }, "获取面试记录失败");
    res.status(500).json({ error: "获取面试记录失败" });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) {
      return res.status(404).json({ error: "面试记录不存在" });
    }
    res.json(interview);
  } catch (err) {
    logger.error({ err }, "获取面试详情失败");
    res.status(500).json({ error: "获取面试详情失败" });
  }
};
