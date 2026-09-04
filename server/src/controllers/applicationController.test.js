import test from "node:test";
import assert from "node:assert/strict";
import Application from "../models/Application.js";
import { getMyAppliedJobIds } from "./applicationController.js";

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
