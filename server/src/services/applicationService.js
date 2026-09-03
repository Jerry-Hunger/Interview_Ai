import Application from "../models/Application.js";
import Student from "../models/Student.js";
import Resume from "../models/Resume.js";
import JobOpening from "../models/JobOpening.js";

export const createApplicationForStudent = async (candidateId, jobId, requestedResumeId) => {
  const student = await Student.findById(candidateId);
  if (!student) {
    const err = new Error("学生不存在");
    err.status = 404;
    throw err;
  }

  const job = await JobOpening.findOne({ _id: jobId, status: "open" });
  if (!job) {
    const err = new Error("职位不存在或已关闭");
    err.status = 404;
    throw err;
  }

  const exists = await Application.findOne({ jobId, candidateId });
  if (exists) {
    const err = new Error("您已申请过该职位");
    err.status = 400;
    throw err;
  }

  const resumeId = requestedResumeId || student.defaultResumeId || student.resumeId;
  if (!resumeId) {
    const err = new Error("请先上传并选择一份简历");
    err.status = 400;
    throw err;
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    studentId: candidateId,
    isArchived: { $ne: true },
    deletedAt: null,
  });
  if (!resume) {
    const err = new Error("所选简历不存在、已归档或不属于当前用户");
    err.status = 400;
    throw err;
  }

  const application = new Application({
    jobId,
    candidateId,
    // 投递时冻结简历版本，后续切换默认简历不会影响企业看到的材料。
    resumeId: resume._id,
    currentRound: 0,
    status: "applied",
    history: [],
  });

  await application.save();
  return application;
};
