import { generateDeepSeekResponse, streamDeepSeekResponse } from "../utils/deepseek.js";
import fs from "fs";
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
  // IMMEDIATE logging at function entry - BEFORE ANYTHING ELSE
  console.error(">>> ========== FUNCTION START ==========");
  console.error(">>> req.url:", req.url);
  console.error(">>> req.method:", req.method);

  // Write to server console AND to a debug file at function entry
  const serverDir = 'D:/Development/Workspace/vscodepro/Interview_Ai/server';
  const debugPath = serverDir + '/debug_log.txt';
  fs.appendFileSync(debugPath, '\n===== FUNCTION START =====\n');
  fs.appendFileSync(debugPath, 'req.url: ' + req.url + '\n');
  fs.appendFileSync(debugPath, 'req.method: ' + req.method + '\n');
  fs.appendFileSync(debugPath, 'req.body keys: ' + Object.keys(req.body || {}).join(',') + '\n');
  fs.appendFileSync(debugPath, 'req.user: ' + (req.user ? req.user.id : 'undefined') + '\n');
  console.error(">>> DEBUG LOG WRITTEN AT FUNCTION ENTRY");

  try {
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

    fs.appendFileSync(debugPath, 'Body parsed\n');

    const studentId = req.user.id;
    fs.appendFileSync(debugPath, 'studentId: ' + studentId + '\n');

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

  fs.appendFileSync(debugPath, 'Setting up SSE headers\n');
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let clientDisconnected = false;
  req.on("close", () => { clientDisconnected = true; });

  const CHUNK_SIZE = 6; // 每块 3 对问答 (每对2条: question + answer)

  const lastEntry = history[history.length - 1];
  const hasSummary = history.length % 2 === 1 && lastEntry?.type === "question";
  const filteredHistory = hasSummary ? history.slice(0, -1) : history;

  const chunks = [];
  // 按问答对分块，每 3 对为一块（3*2=6条），确保问答对完整性
  for (let i = 0; i < filteredHistory.length; i += CHUNK_SIZE) {
    chunks.push(filteredHistory.slice(i, Math.min(i + CHUNK_SIZE, filteredHistory.length)));
  }

  console.error(">>> Entering try block in concludeInterviewStream");
  fs.appendFileSync(debugPath, '=== START REQUEST ===\n');
  console.error(">>> debugPath initialized: " + debugPath);

  // Check if history is valid
  if (!Array.isArray(history)) {
    console.error(">>> ERROR: history is not an array:", typeof history);
    fs.appendFileSync(debugPath, 'ERROR: history is not array: ' + typeof history + '\n');
  }
  fs.appendFileSync(debugPath, 'History check passed, length: ' + history.length + '\n');

  console.error(">>> Inside try, starting feedbacks array");
  const feedbacks = [];
  fs.appendFileSync(debugPath, 'Starting chunk processing\n');
  console.error(">>> feedbacks array created, chunks:", chunks.length);
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
    console.error(">>> Chunk processing complete, feedbacks count:", feedbacks.length);

    const finalPrompt = concludeFinal({
      // 对话格式为 [Q1, A1, Q2, A2, ...]，所以问题数 = 条目数 / 2
      historyLength: Math.ceil(filteredHistory.length / 2),
      chunksLength: chunks.length,
      roleSummary,
      difficulty,
      resumeText,
      feedbacks,
    });
    console.error(">>> Final prompt created, about to write FINAL_START");

    res.write("[FINAL_START]\n");
    console.error(">>> FINAL_START written, about to stream");
    fs.appendFileSync(debugPath, 'Writing FINAL_START, about to call streamDeepSeekResponse\n');
    let fullFinalFeedback = "";
    let chunkCount = 0;
    console.error(">>> About to enter stream loop");
    fs.appendFileSync(debugPath, 'Entering stream loop\n');
    try {
      for await (const chunk of streamDeepSeekResponse(finalPrompt)) {
        console.error(">>> Final chunk:", chunk.slice(0, 50));
        fullFinalFeedback += chunk;
        res.write(chunk);
        chunkCount++;
        if (chunkCount % 100 === 0) console.error(">>> Streamed", chunkCount, "chunks");
      }
      console.error(">>> Stream complete, chunks:", chunkCount);
      fs.appendFileSync(debugPath, 'Stream complete: ' + chunkCount + ' chunks\n');
    } catch (streamErr) {
      console.error(">>> Stream error:", streamErr.message);
      fs.appendFileSync(debugPath, 'Stream error: ' + streamErr.message + '\n');
      throw streamErr;
    }
    console.error(">>> Final feedback stream complete, total chunks:", chunkCount, "total length:", fullFinalFeedback.length);

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
    console.log("Result line found:", resultLine, "Full feedback length:", fullFinalFeedback.length);
    console.log("About to determine result...");
    const result = (resultLine && resultLine.includes("不通过")) ? "failure" : "success";
    console.log("Determined result:", result);

    fs.appendFileSync(debugPath, 'About to create interview object\n');
    console.log("Creating interview with studentId:", studentId, "result:", result);
    let interview;
    try {
      interview = new Interview({
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
      fs.appendFileSync(debugPath, 'Interview object created\n');
      console.log("Interview object created, about to save...");
    } catch (constructorErr) {
      fs.appendFileSync(debugPath, 'Constructor error: ' + constructorErr.message + '\n');
      console.error("Interview constructor error:", constructorErr.message);
      throw constructorErr;
    }

    let saveError = null;
    try {
      await interview.save();
      console.log("Saved interview:", interview._id);
      fs.appendFileSync(debugPath, 'Saved! ID: ' + interview._id + '\n');
    } catch (err) {
      saveError = err;
      console.error("Interview save error:", err.message, err.stack);
      fs.appendFileSync(debugPath, 'Save error: ' + err.message + '\n');
    }

    if (saveError) {
      if (!res.headersSent) {
        res.status(500).json({ error: "保存面试记录失败" });
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: "保存面试记录失败" })}\n\n`);
        res.end();
      }
      return;
    }

    console.log("Flushing DONE marker...");
    const doneMarker = `\n[DONE:${interview._id}:${result}]\n`;
    console.log("DONE marker prepared, about to write...");
    try {
      res.write(doneMarker);
      console.log("DONE marker written to response");
      res.end();
      console.log("Response ended");
    } catch (writeErr) {
      console.error("Error writing DONE marker:", writeErr.message);
    }
    console.log("Function returning normally");
  } catch (error) {
    console.error("=== CAUGHT ERROR IN concludeInterviewStream ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("res.headersSent:", res.headersSent);
    console.error("res.writableEnded:", res.writableEnded);
    console.error("=== END CAUGHT ERROR ===");
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
