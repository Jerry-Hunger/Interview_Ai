import { concludeChunk, concludeFinal } from "../prompts/interview.js";

const formatBlock = (block) => {
  let result = "";
  let questionNumber = 1;
  for (let index = 0; index < block.length; index++) {
    if (block[index].type !== "question") continue;
    result += `问${questionNumber}：${block[index].content}\n`;
    if (block[index + 1]?.type === "answer") {
      result += `答${questionNumber}：${block[index + 1].content}\n\n`;
      index++;
    }
    questionNumber++;
  }
  return result.trim();
};

/**
 * 普通与流式结束面试共享同一份分块和提示词计划，保证评估口径一致。
 */
export const createEvaluationPlan = ({ history, roleSummary, resumeText, roundType, customTopic, difficulty }) => {
  const lastEntry = history.at(-1);
  const answerHistory = history.length % 2 === 1 && lastEntry?.type === "question" ? history.slice(0, -1) : history;
  const chunkSize = 6;
  const chunks = [];
  for (let index = 0; index < answerHistory.length; index += chunkSize) {
    chunks.push(answerHistory.slice(index, index + chunkSize));
  }

  return {
    chunkCount: chunks.length,
    getChunkPrompt: (index) => concludeChunk({
      chunkIndex: index,
      totalChunks: chunks.length,
      blockContent: formatBlock(chunks[index]),
      roleSummary,
      resumeText,
      roundType,
      customTopic,
    }),
    getFinalPrompt: (feedbacks) => concludeFinal({
      historyLength: Math.ceil(answerHistory.length / 2),
      chunksLength: chunks.length,
      roleSummary,
      difficulty,
      resumeText,
      feedbacks,
    }),
  };
};

/**
 * SSE 结束面试按同一顺序执行分块评估与最终汇总，调用方只负责转发事件。
 */
export const executeEvaluationPlan = async ({ plan, generateChunk, generateFinal, concurrent = false, shouldStop }) => {
  const indexes = Array.from({ length: plan.chunkCount }, (_, index) => index);
  const evaluateChunk = async (index) => (await generateChunk(plan.getChunkPrompt(index), index)).trim();
  let feedbacks;
  if (concurrent) {
    feedbacks = await Promise.all(indexes.map(evaluateChunk));
  } else {
    feedbacks = [];
    for (const index of indexes) {
      // 客户端断开后不再调用模型，也不写入不完整面试记录。
      if (shouldStop?.()) return { feedbacks, finalFeedback: "", aborted: true };
      feedbacks.push(await evaluateChunk(index));
    }
  }
  if (shouldStop?.()) return { feedbacks, finalFeedback: "", aborted: true };
  const finalFeedback = (await generateFinal(plan.getFinalPrompt(feedbacks))).trim();
  return { feedbacks, finalFeedback, aborted: false };
};

export const buildInterviewRecord = ({ studentId, history, context, resumeText, type, difficulty, roleSummary, roundType, customTopic, totalRounds, currentRound, feedbacks = [], finalFeedback, result }) => ({
  student: studentId,
  chatHistory: history,
  feedbacks,
  finalFeedback,
  result,
  type,
  ...context.interviewFields,
  difficulty,
  resumeText,
  roleSummary,
  roundType,
  customTopic,
  rounds: totalRounds || 1,
  currentRound: currentRound || 1,
  createdAt: new Date(),
});
