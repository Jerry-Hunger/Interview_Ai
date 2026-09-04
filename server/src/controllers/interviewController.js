import { streamDeepSeekResponse } from "../utils/deepseek.js";
import Interview from "../models/Interview.js";
import Resume from "../models/Resume.js";
import Application from "../models/Application.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import {
  startInterviewFirstRound,
  startInterviewContinuationRound,
  respondNormal,
  respondLastQuestion,
} from "../prompts/interview.js";
import { getPagination, toPaginationMeta } from "../utils/pagination.js";
import { success, error as sendError } from "../utils/apiResponse.js";
import { buildInterviewRecord, createEvaluationPlan, executeEvaluationPlan } from "../services/interviewEvaluation.js";
import { beginSse, sendSseError, sendSseEvent } from "../utils/sseResponse.js";

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

export const startInterviewStream = async (req, res) => {
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
    beginSse(res);
    let clientDisconnected = false;
    req.on("close", () => { clientDisconnected = true; });
    for await (const chunk of streamDeepSeekResponse(prompt)) {
      if (clientDisconnected) break;
      sendSseEvent(res, { type: "content", content: chunk });
    }
    if (!clientDisconnected) {
      sendSseEvent(res, { type: "done" });
      res.end();
    }
  } catch (error) {
    logger.error({ error: error.message }, "流式开始面试失败");
    if (!res.headersSent) {
      sendError(res, error.status ? error.message : "AI 响应失败，请稍后重试。", error.status || 500);
    } else {
      sendSseError(res, "AI 响应失败，请稍后重试。");
    }
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
    logger.error({ error: error.message }, "流式回答面试失败");
    if (!res.writableEnded) {
      sendSseError(res, "AI 响应失败，请稍后重试。");
    }
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

    beginSse(res);

    if (clientResult === "quit") {
      const interview = new Interview(buildInterviewRecord({
        studentId, history, context, resumeText: selectedResumeText, type: typeOfInterview,
        difficulty, roleSummary, roundType, customTopic, totalRounds, currentRound,
        finalFeedback: "面试已退出，未完成评估。", result: "quit",
      }));
      await interview.save();
      sendSseEvent(res, {
        type: "done",
        interviewId: String(interview._id),
        result: "quit",
        feedbacks: [],
        finalFeedback: "面试已退出，未完成评估。",
      });
      return res.end();
    }

    let clientDisconnected = false;
    req.on("close", () => { clientDisconnected = true; });

    const evaluationPlan = createEvaluationPlan({
      history,
      roleSummary,
      resumeText: selectedResumeText,
      roundType,
      customTopic,
      difficulty,
    });

    const evaluation = await executeEvaluationPlan({
      plan: evaluationPlan,
      shouldStop: () => clientDisconnected,
      generateChunk: async (prompt, index) => {
        if (clientDisconnected) return "";
        sendSseEvent(res, { type: "chunk-start", index });
        let fullFeedback = "";
        for await (const chunk of streamDeepSeekResponse(prompt)) {
          fullFeedback += chunk;
          if (!clientDisconnected) sendSseEvent(res, { type: "chunk", text: chunk });
        }
        if (!clientDisconnected) sendSseEvent(res, { type: "chunk-end", index });
        return fullFeedback;
      },
      generateFinal: async (prompt) => {
        if (!clientDisconnected) sendSseEvent(res, { type: "final-start" });
        let fullFinalFeedback = "";
        for await (const chunk of streamDeepSeekResponse(prompt)) {
          fullFinalFeedback += chunk;
          if (!clientDisconnected) sendSseEvent(res, { type: "final", text: chunk });
        }
        return fullFinalFeedback;
      },
    });
    if (evaluation.aborted) return;
    const { feedbacks, finalFeedback: fullFinalFeedback } = evaluation;

    const result = parseResultFromFeedback(fullFinalFeedback);

    const interview = new Interview(buildInterviewRecord({
      studentId, history, context, resumeText: selectedResumeText, type: typeOfInterview,
      difficulty, roleSummary, roundType, customTopic, totalRounds, currentRound,
      feedbacks, finalFeedback: fullFinalFeedback, result,
    }));

    await interview.save();

    sendSseEvent(res, {
      type: "done",
      interviewId: String(interview._id),
      result,
      feedbacks,
      finalFeedback: fullFinalFeedback,
    });
    res.end();
  } catch (error) {
    logger.error({ error: error.message }, "流式结束面试失败");
    if (!res.headersSent) {
      sendError(res, error.status ? error.message : "生成反馈失败，请稍后重试。", error.status || 500);
    } else if (!res.writableEnded) {
      sendSseError(res, "生成反馈失败，请稍后重试。");
    }
  }
};

export const getUserInterviews = async (req, res) => {
  try {
    const studentId = req.user.id;
    const pagination = getPagination(req.query);
    logger.info({ studentId }, "获取学生面试记录");
    const filter = { student: studentId };
    const [interviews, total, resultStats] = await Promise.all([
      Interview.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean(),
      Interview.countDocuments(filter),
      Interview.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(studentId) } },
        { $group: { _id: "$result", count: { $sum: 1 } } },
      ]),
    ]);
    const stats = { total, success: 0, failure: 0, quit: 0 };
    for (const item of resultStats) {
      if (item._id in stats) stats[item._id] = item.count;
    }
    success(res, { interviews, pagination: toPaginationMeta(pagination, total), stats });
  } catch (err) {
    logger.error({ err }, "获取面试记录失败");
    sendError(res, "获取面试记录失败");
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) {
      return sendError(res, "面试记录不存在", 404);
    }
    success(res, { interview });
  } catch (err) {
    logger.error({ err }, "获取面试详情失败");
    sendError(res, "获取面试详情失败");
  }
};
