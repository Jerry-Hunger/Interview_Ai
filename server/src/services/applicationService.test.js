import test from "node:test";
import assert from "node:assert/strict";
import Application from "../models/Application.js";
import Student from "../models/Student.js";
import Resume from "../models/Resume.js";
import JobOpening from "../models/JobOpening.js";
import { createApplicationForStudent } from "./applicationService.js";

const ids = {
  student: "64b64c9f4f946a4c5a000001",
  job: "64b64c9f4f946a4c5a000002",
  resume: "64b64c9f4f946a4c5a000003",
};

test("投递服务会校验职位、简历归属并冻结所选简历", async () => {
  const originals = {
    student: Student.findById,
    job: JobOpening.findOne,
    application: Application.findOne,
    resume: Resume.findOne,
    save: Application.prototype.save,
  };
  Student.findById = async () => ({ _id: ids.student, defaultResumeId: ids.resume });
  JobOpening.findOne = async (filter) => ({ _id: filter._id, status: "open" });
  Application.findOne = async () => null;
  Resume.findOne = async (filter) => ({ _id: filter._id, studentId: ids.student });
  Application.prototype.save = async function save() { return this; };
  try {
    const application = await createApplicationForStudent(ids.student, ids.job, ids.resume);
    assert.equal(String(application.jobId), ids.job);
    assert.equal(String(application.candidateId), ids.student);
    assert.equal(String(application.resumeId), ids.resume);
    assert.equal(application.status, "applied");
  } finally {
    Student.findById = originals.student;
    JobOpening.findOne = originals.job;
    Application.findOne = originals.application;
    Resume.findOne = originals.resume;
    Application.prototype.save = originals.save;
  }
});
