import Application from "../models/Application.js";
import { createApplicationForStudent } from "../services/applicationService.js";
import { success, error } from "../utils/apiResponse.js";

export const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidateId = req.user.id;
    const application = await createApplicationForStudent(candidateId, jobId);
    success(res, { application }, 201);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    console.error("Error creating application:", err);
    error(res, "服务器错误");
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("candidateId");
    success(res, { applications });
  } catch (err) {
    console.error("Error fetching applications:", err);
    error(res, "服务器错误");
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user.id;
    if (!candidateId) return error(res, "未授权", 401);

    const applications = await Application.find({ candidateId })
      .populate("jobId")
      .populate("candidateId")
      .populate("resumeId")
      .sort({ createdAt: -1 });

    return success(res, { applications });
  } catch (err) {
    console.error("getMyApplications error:", err);
    return error(res, "服务器错误");
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate("candidateId")
      .populate("resumeId");
    success(res, { applications });
  } catch (err) {
    console.error("Error fetching job applications:", err);
    error(res, "服务器错误");
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId")
      .populate("resumeId");

    if (!application) {
      return error(res, "申请记录不存在", 404);
    }
    success(res, { application });
  } catch (err) {
    console.error("Error fetching application:", err);
    error(res, "服务器错误");
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "applied",
      "in-progress",
      "selected",
      "final-selected",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return error(res, "无效的状态值", 400);
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return error(res, "申请记录不存在", 404);
    }

    application.status = status;
    await application.save();

    success(res, { message: "状态更新成功", application });
  } catch (err) {
    console.error("Error updating status:", err);
    error(res, "服务器错误");
  }
};

export const addRoundResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roundNumber, interviewId, result, feedback } = req.body;

    if (!["success", "failure"].includes(result)) {
      return error(res, "结果值无效，请使用 'success' 或 'failure'", 400);
    }

    const application = await Application.findById(applicationId).populate(
      "jobId"
    );
    if (!application) {
      return error(res, "申请记录不存在", 404);
    }

    const rn = Number(roundNumber);
    if (!rn || rn < 1) {
      return error(res, "轮次编号无效", 400);
    }

    application.history.push({
      roundNumber: rn,
      interviewId: interviewId || null,
      result,
      feedback: feedback || "",
    });

    const totalRounds = Array.isArray(application.jobId?.rounds)
      ? application.jobId.rounds.length
      : 0;

    if (result === "success") {
      application.currentRound = rn;

      if (totalRounds > 0 && rn >= totalRounds) {
        application.status = "selected";
      } else {
        application.status = "in-progress";
      }
    } else {
      application.status = "rejected";
    }

    await application.save();

    const updated = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId")
      .populate("resumeId");

    return success(res, { message: "轮次结果保存成功", application: updated });
  } catch (err) {
    console.error("addRoundResult error:", err.message);
    return error(res, "服务器错误");
  }
};

export default {
  createApplication,
  getAllApplications,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  addRoundResult,
};
