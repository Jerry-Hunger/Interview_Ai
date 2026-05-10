import Application from "../models/Application.js";
import Student from "../models/Student.js";
import Resume from "../models/Resume.js";
import Company from "../models/Company.js";
import { createApplicationForStudent } from "../services/applicationService.js";
import { success, error } from "../utils/apiResponse.js";
import { sendInterviewApprovalEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

export const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidateId = req.user.id;
    const application = await createApplicationForStudent(candidateId, jobId);
    success(res, { application }, 201);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    logger.error({ err }, "创建申请失败");
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

    // 补充缺失的 resumeId：循环外查一次，避免 N+1
    const student = await Student.findById(candidateId);
    if (student?.resumeId) {
      const resume = await Resume.findById(student.resumeId);
      if (resume) {
        for (const app of applications) {
          if (!app.resumeId) {
            app.resumeId = resume;
          }
        }
      }
    }

    return success(res, { applications });
  } catch (err) {
    logger.error({ err }, "获取我的申请失败");
    return error(res, "服务器错误");
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate("candidateId")
      .populate("resumeId");

    // candidateId 已 populate，直接从中取 resumeId，无需再查 Student
    for (const app of applications) {
      if (!app.resumeId && app.candidateId?.resumeId) {
        const resume = await Resume.findById(app.candidateId.resumeId);
        if (resume) {
          app.resumeId = resume;
        }
      }
    }

    success(res, { applications });
  } catch (err) {
    logger.error({ err }, "获取职位申请列表失败");
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

    // candidateId 已 populate，直接取 resumeId
    if (!application.resumeId && application.candidateId?.resumeId) {
      const resume = await Resume.findById(application.candidateId.resumeId);
      if (resume) {
        application.resumeId = resume;
      }
    }

    success(res, { application });
  } catch (err) {
    logger.error({ err }, "获取申请详情失败");
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

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");
    if (!application) {
      return error(res, "申请记录不存在", 404);
    }

    const previousStatus = application.status;

    // approvedThrough 追踪企业已批准的轮次
    if (previousStatus === "in-progress" && status === "in-progress") {
      application.approvedThrough = (application.approvedThrough || 0) + 1;
    } else if (previousStatus === "applied" && status === "in-progress") {
      application.approvedThrough = 1;
    } else if (previousStatus === "in-progress" && status === "selected") {
      application.approvedThrough = (application.approvedThrough || 0) + 1;
    }

    application.status = status;
    await application.save();

    // 当状态从 "applied" 变为 "in-progress" 时，发送面试批准邮件
    if (previousStatus === "applied" && status === "in-progress") {
      const candidate = application.candidateId;
      const job = application.jobId;

      if (candidate?.email) {
        const company = await Company.findById(job?.companyId).select("companyName");

        sendInterviewApprovalEmail(
          candidate.email,
          candidate.fullName || "",
          company?.companyName || "本公司",
          job?.title || "该职位"
        ).catch(err => {
          logger.error({ err }, "异步发送邮件失败");
        });
      }
    }

    // save 后补充 populate resumeId，避免重复查询
    await application.populate("resumeId");
    success(res, { message: "状态更新成功", application });
  } catch (err) {
    logger.error({ err }, "更新申请状态失败");
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

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");
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

    // save 后补充 populate resumeId，避免重复查询
    await application.populate("resumeId");
    return success(res, { message: "轮次结果保存成功", application });
  } catch (err) {
    logger.error({ err: err.message }, "添加轮次结果失败");
    return error(res, "服务器错误");
  }
};

export default {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  addRoundResult,
};
