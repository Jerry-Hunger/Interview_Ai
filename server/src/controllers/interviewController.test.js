import test from "node:test";
import assert from "node:assert/strict";
import Interview from "../models/Interview.js";
import { getUserInterviews } from "./interviewController.js";

const createResponse = () => ({
  body: null,
  status() { return this; },
  json(body) { this.body = body; return this; },
});

test("面试记录分页同时返回全量结果统计", async () => {
  const originalFind = Interview.find;
  const originalCountDocuments = Interview.countDocuments;
  const originalAggregate = Interview.aggregate;
  let aggregatePipeline;
  Interview.find = () => ({
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean: async () => [{ _id: "interview-1", result: "success" }],
  });
  Interview.countDocuments = async () => 41;
  Interview.aggregate = async (pipeline) => {
    aggregatePipeline = pipeline;
    return [{ _id: "success", count: 30 }, { _id: "failure", count: 10 }, { _id: "quit", count: 1 }];
  };
  try {
    const res = createResponse();
    await getUserInterviews({ user: { id: "64b64c9f4f946a4c5a000001" }, query: { page: "2" } }, res);
    assert.equal(res.body.pagination.totalPages, 3);
    assert.deepEqual(res.body.stats, { total: 41, success: 30, failure: 10, quit: 1 });
    assert.equal(aggregatePipeline[0].$match.student.toString(), "64b64c9f4f946a4c5a000001");
  } finally {
    Interview.find = originalFind;
    Interview.countDocuments = originalCountDocuments;
    Interview.aggregate = originalAggregate;
  }
});
