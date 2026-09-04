import test from "node:test";
import assert from "node:assert/strict";
import Application from "../models/Application.js";
import JobOpening from "../models/JobOpening.js";
import { getCompanyDashboard } from "./companyController.js";

const createResponse = () => ({
  body: null,
  status() { return this; },
  json(body) { this.body = body; return this; },
});

test("企业仪表盘使用聚合统计并限制活跃职位和近期申请数量", async () => {
  const originalJobAggregate = JobOpening.aggregate;
  const originalApplicationAggregate = Application.aggregate;
  const originalPopulate = Application.populate;
  const queries = [];
  JobOpening.aggregate = async (pipeline) => {
    queries.push(pipeline);
    return [{ counts: [{ totalJobs: 8, activeJobs: 3 }], activeJobs: [{ _id: "job-1", title: "后端" }] }];
  };
  Application.aggregate = async (pipeline) => {
    queries.push(pipeline);
    return [{ statusStats: [{ _id: "applied", count: 2 }], recentApplications: [{ candidateId: "student-1", jobId: "job-1" }] }];
  };
  Application.populate = async (items) => items;
  try {
    const res = createResponse();
    await getCompanyDashboard({ user: { id: "64b64c9f4f946a4c5a000001" } }, res);
    assert.equal(res.body.stats.totalJobs, 8);
    assert.equal(res.body.stats.activeJobs, 3);
    assert.equal(res.body.stats.totalApplications, 2);
    assert.equal(queries[0][1].$facet.activeJobs.find((stage) => stage.$limit).$limit, 5);
    assert.ok(queries[1].some((stage) => stage.$lookup));
  } finally {
    JobOpening.aggregate = originalJobAggregate;
    Application.aggregate = originalApplicationAggregate;
    Application.populate = originalPopulate;
  }
});
