import Application from "../models/Application.js";
import Student from "../models/Student.js";

export const createApplicationForStudent = async (candidateId, jobId) => {
  const student = await Student.findById(candidateId);
  if (!student) {
    const err = new Error("学生不存在");
    err.status = 404;
    throw err;
  }

  const exists = await Application.findOne({ jobId, candidateId });
  if (exists) {
    const err = new Error("您已申请过该职位");
    err.status = 400;
    throw err;
  }

  const application = new Application({
    jobId,
    candidateId,
    resumeId: student.resumeId || null,
    currentRound: 0,
    status: "applied",
    history: [],
  });

  await application.save();
  return application;
};
