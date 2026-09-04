import test from "node:test";
import assert from "node:assert/strict";
import Company from "../models/Company.js";
import JobOpening from "../models/JobOpening.js";
import { listJobs } from "./jobController.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("公司搜索将正则元字符作为普通文本处理", async () => {
  const originalCompanyFind = Company.find;
  const originalJobFind = JobOpening.find;
  const originalCountDocuments = JobOpening.countDocuments;
  let companyFilter;
  Company.find = (filter) => {
    companyFilter = filter;
    return { select: async () => [] };
  };
  JobOpening.find = () => ({
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean: async () => [],
  });
  JobOpening.countDocuments = async () => 0;

  try {
    const res = createResponse();
    await listJobs({ query: { company: "[", page: "1" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(companyFilter.companyName.source, "\\[");
    assert.equal(res.body.success, true);
  } finally {
    Company.find = originalCompanyFind;
    JobOpening.find = originalJobFind;
    JobOpening.countDocuments = originalCountDocuments;
  }
});
