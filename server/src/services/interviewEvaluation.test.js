import test from "node:test";
import assert from "node:assert/strict";
import { buildInterviewRecord, createEvaluationPlan } from "./interviewEvaluation.js";

const history = [
  { type: "question", content: "问题一" }, { type: "answer", content: "回答一" },
  { type: "question", content: "问题二" }, { type: "answer", content: "回答二" },
  { type: "question", content: "结束语" },
];

test("评估计划会排除最后的收尾问题并按问答对生成提示词", () => {
  const plan = createEvaluationPlan({
    history,
    roleSummary: "后端工程师",
    resumeText: "候选人简历",
    roundType: "technical",
    customTopic: "Node.js",
    difficulty: "intermediate",
  });
  assert.equal(plan.chunkCount, 1);
  assert.match(plan.getChunkPrompt(0), /问题一/);
  assert.doesNotMatch(plan.getChunkPrompt(0), /结束语/);
  assert.match(plan.getFinalPrompt(["反馈"]), /反馈/);
});

test("面试记录构建同时适用于普通与流式结束路径", () => {
  const record = buildInterviewRecord({
    studentId: "student-id",
    history: [],
    context: { interviewFields: { resumeId: "resume-id" } },
    resumeText: "简历",
    type: "practice",
    difficulty: "beginner",
    roleSummary: "开发",
    roundType: "technical",
    customTopic: "",
    totalRounds: 1,
    currentRound: 1,
    finalFeedback: "反馈",
    result: "success",
  });
  assert.equal(record.resumeId, "resume-id");
  assert.equal(record.result, "success");
  assert.deepEqual(record.feedbacks, []);
});
