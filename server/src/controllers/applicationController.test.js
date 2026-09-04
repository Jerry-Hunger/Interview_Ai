import test from "node:test";
import assert from "node:assert/strict";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import { addRoundResult, getMyAppliedJobIds } from "./applicationController.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("已投递职位索引查询只返回当前学生的职位 ID", async () => {
  const originalDistinct = Application.distinct;
  const calls = [];
  Application.distinct = async (...args) => {
    calls.push(args);
    return ["job-a", "job-b"];
  };
  try {
    const res = createResponse();
    await getMyAppliedJobIds({ user: { id: "student-1" } }, res);
    assert.deepEqual(calls, [["jobId", { candidateId: "student-1" }]]);
    assert.deepEqual(res.body, { success: true, jobIds: ["job-a", "job-b"] });
  } finally {
    Application.distinct = originalDistinct;
  }
});

test("提交轮次结果只保存服务端面试反馈", async () => {
  const originalFindById = Application.findById;
  const originalFindOne = Interview.findOne;
  const application = {
    jobId: { _id: "job-1", rounds: [{}] },
    candidateId: { _id: { equals: (id) => id === "student-1" } },
    status: "in-progress",
    currentRound: 0,
    approvedThrough: 1,
    history: [],
    save: async () => {},
    populate: async () => application,
  };
  Application.findById = () => ({
    populate() { return this; },
    then(resolve) { return Promise.resolve(application).then(resolve); },
  });
  Interview.findOne = async () => ({ result: "success", finalFeedback: "服务端评估结论" });

  try {
    const res = createResponse();
    await addRoundResult({
      params: { applicationId: "application-1" },
      body: { roundNumber: 1, interviewId: "interview-1", result: "success", feedback: "伪造反馈" },
      user: { id: "student-1" },
    }, res);
    assert.equal(application.history[0].feedback, "服务端评估结论");
    assert.equal(res.body.success, true);
  } finally {
    Application.findById = originalFindById;
    Interview.findOne = originalFindOne;
  }
});
