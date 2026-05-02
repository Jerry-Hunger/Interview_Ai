import { generateDeepSeekResponse, streamDeepSeekResponse } from "../utils/deepseek.js";
import Interview from "../models/Interview.js";
import {
  startInterviewFirstRound,
  startInterviewContinuationRound,
  respondNormal,
  respondLastQuestion,
  concludeChunk,
  concludeFinal,
} from "../prompts/interview.js";

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
  const { role, resume, roundType, topic, difficulty, isContinuation, currentRound, totalRounds, previousFeedback } =
    req.body;

  let prompt;
  if (isContinuation && currentRound && totalRounds) {
    prompt = startInterviewContinuationRound({
      resume,
      role,
      roundType,
      topic,
      difficulty,
      currentRound,
      totalRounds,
      previousFeedback,
    });
  } else {
    prompt = startInterviewFirstRound({ resume, role, roundType, topic, difficulty });
  }

  try {
    const response = await generateDeepSeekResponse(prompt);
    res.json({ message: response.trim() });
  } catch (error) {
    console.error("startInterview error:", error.message);
    res.status(500).json({ error: "AI 响应失败，请稍后重试。" });
  }
};

export const respondToInterview = async (req, res) => {
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

  try {
    const responseText = await generateDeepSeekResponse(prompt);
    res.json({ message: responseText.trim() });
  } catch (error) {
    console.error("respondToInterview error:", error.message);
    res.status(500).json({ error: "AI 响应失败，请稍后重试。" });
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
    console.error("respondToInterviewStream error:", error.message);
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
    result: clientResult,
    totalRounds,
    currentRound,
  } = req.body;

  const studentId = req.user.id;

  try {
  if (clientResult === "Quit") {
    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      finalFeedback: "面试已退出，未完成评估。",
      result: "quit",
      type: typeOfInterview,
      difficulty,
      resumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });
    await interview.save();
    console.log("Saved quit interview:", interview._id);
    return res.json({ interview });
  }

  const CHUNK_SIZE = 5;

  const lastEntry = history[history.length - 1];
  const hasSummary = history.length % 2 === 1 && lastEntry?.type === "question";
  const filteredHistory = hasSummary ? history.slice(0, -1) : history;

  const chunks = [];
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
        resumeText,
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
    resumeText,
    feedbacks,
  });

  const finalFeedback = await generateDeepSeekResponse(finalPrompt);

  const resultLine = finalFeedback
    .split("\n")
    .find(
      (line) =>
        line.includes("结果：通过") ||
        line.includes("结果:通过") ||
        line.includes("结果：不通过") ||
        line.includes("结果:不通过")
    );

  const result = resultLine?.includes("不通过") ? "failure" : "success";

  const interview = new Interview({
    student: studentId,
    chatHistory: history,
    feedbacks,
    finalFeedback,
    result,
    type: typeOfInterview,
    difficulty,
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    rounds: totalRounds || 1,
    currentRound: currentRound || 1,
    createdAt: new Date(),
  });
  await interview.save();
  console.log("Saved interview:", interview._id);
  res.json({ interview, feedbacks });
  } catch (error) {
    console.error("concludeInterview error:", error.message);
    res.status(500).json({ error: "生成反馈失败，请稍后重试。" });
  }
};

export const concludeInterviewStream = async (req, res) => {
  const {
    history = [],
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    difficulty,
    typeOfInterview,
    result: clientResult,
    totalRounds,
    currentRound,
  } = req.body;

  const studentId = req.user.id;

  if (clientResult === "Quit") {
    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      finalFeedback: "面试已退出，未完成评估。",
      result: "quit",
      type: typeOfInterview,
      difficulty,
      resumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });
    await interview.save();
    console.log("Saved quit interview:", interview._id);
    return res.json({ interview });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let clientDisconnected = false;
  req.on("close", () => { clientDisconnected = true; });

  const CHUNK_SIZE = 5;

  const lastEntry = history[history.length - 1];
  const hasSummary = history.length % 2 === 1 && lastEntry?.type === "question";
  const filteredHistory = hasSummary ? history.slice(0, -1) : history;

  const chunks = [];
  for (let i = 0; i < filteredHistory.length; i += CHUNK_SIZE) {
    chunks.push(filteredHistory.slice(i, Math.min(i + CHUNK_SIZE, filteredHistory.length)));
  }

  try {
    const feedbacks = [];

    for (let i = 0; i < chunks.length; i++) {
      if (clientDisconnected) break;
      const prompt = concludeChunk({
        chunkIndex: i,
        totalChunks: chunks.length,
        blockContent: formatBlock(chunks[i]),
        roleSummary,
        resumeText,
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
      historyLength: filteredHistory.length,
      chunksLength: chunks.length,
      roleSummary,
      difficulty,
      resumeText,
      feedbacks,
    });

    res.write("[FINAL_START]\n");

    let fullFinalFeedback = "";
    for await (const chunk of streamDeepSeekResponse(finalPrompt)) {
      fullFinalFeedback += chunk;
      res.write(chunk);
    }

    const resultLine = fullFinalFeedback
      .split("\n")
      .find(
        (line) =>
          line.includes("评估结论：通过") ||
          line.includes("评估结论:通过") ||
          line.includes("评估结论：不通过") ||
          line.includes("评估结论:不通过") ||
          line.includes("结果：通过") ||
          line.includes("结果:通过") ||
          line.includes("结果：不通过") ||
          line.includes("结果:不通过")
      );

    const result = resultLine?.includes("不通过") ? "failure" : "success";

    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      feedbacks,
      finalFeedback: fullFinalFeedback,
      result,
      type: typeOfInterview,
      difficulty,
      resumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });
    await interview.save();
    console.log("Saved interview:", interview._id);

    res.write(`\n[DONE:${interview._id}:${result}]\n`);
    res.end();
  } catch (error) {
    console.error("concludeInterviewStream error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "生成反馈失败，请稍后重试。" });
    } else if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "生成反馈失败，请稍后重试。" })}\n\n`);
      res.end();
    }
  }
};

export const getUserInterviews = async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log("Fetching interviews for student:", studentId);
    const interviews = await Interview.find({ student: studentId }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    console.error("Error fetching interviews:", err);
    res.status(500).json({ error: "获取面试记录失败" });
  }
};

export const summarizeRole = async (req, res) => {
  const { prompt } = req.body;

  try {
    const summary = await generateDeepSeekResponse(prompt);
    res.json({ summary });
  } catch (err) {
    console.error("summarizeRole error:", err.message);
    res.status(500).json({ error: "职位总结生成失败" });
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
    console.error("Error fetching interview by ID:", err);
    res.status(500).json({ error: "获取面试详情失败" });
  }
};
