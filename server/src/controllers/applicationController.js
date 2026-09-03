import Application from "../models/Application.js";
import Student from "../models/Student.js";
import Resume from "../models/Resume.js";
import Company from "../models/Company.js";
import JobOpening from "../models/JobOpening.js";
import Interview from "../models/Interview.js";
import { createApplicationForStudent } from "../services/applicationService.js";
import { success, error } from "../utils/apiResponse.js";
import { sendInterviewApprovalEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

export const createApplication = async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;
    const candidateId = req.user.id;
    const application = await createApplicationForStudent(candidateId, jobId, resumeId);
    success(res, { application }, 201);
  } catch (err) {
    if (err?.code === 11000) return error(res, "您已申请过该职位", 409);
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

    // 仅兼容旧申请记录：未冻结简历的历史数据回退到旧默认简历。
    const student = await Student.findById(candidateId);
    const defaultResumeId = student?.defaultResumeId || student?.resumeId;
    if (defaultResumeId) {
      const resume = await Resume.findById(defaultResumeId);
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
    const job = await JobOpening.findOne({ _id: jobId, companyId: req.user.id });
    if (!job) return error(res, "职位不存在或无权访问", 404);
    const applications = await Application.find({ jobId })
      .populate("candidateId")
      .populate("resumeId")
      .sort({ createdAt: -1 });

    for (const app of applications) {
      if (!app.resumeId && app.candidateId) {
        const defaultResumeId = app.candidateId.defaultResumeId || app.candidateId.resumeId;
        const resume = defaultResumeId && await Resume.findById(defaultResumeId);
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

    const isCandidate = application.candidateId?._id.equals(req.user.id);
    const isOwnerCompany = application.jobId?.companyId?.equals(req.user.id);
    if (!isCandidate && !isOwnerCompany) return error(res, "无权访问该申请", 403);

    if (!application.resumeId && application.candidateId) {
      const defaultResumeId = application.candidateId.defaultResumeId || application.candidateId.resumeId;
      const resume = defaultResumeId && await Resume.findById(defaultResumeId);
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
    if (!application.jobId?.companyId?.equals(req.user.id)) {
      return error(res, "无权更新该申请", 403);
    }

    const previousStatus = application.status;
    const allowedTransitions = {
      applied: ["in-progress", "rejected"],
      "in-progress": ["in-progress", "selected", "rejected"],
      selected: ["final-selected", "rejected"],
      "final-selected": [],
      rejected: [],
    };
    if (!allowedTransitions[previousStatus].includes(status)) {
      return error(res, "当前申请状态不允许该操作", 409);
    }

    // approvedThrough 追踪企业已批准的轮次
    if (previousStatus === "in-progress" && status === "in-progress") {
      if (application.approvedThrough >= application.jobId.rounds.length) {
        return error(res, "所有面试轮次均已开启", 409);
      }
      application.approvedThrough = (application.approvedThrough || 0) + 1;
    } else if (previousStatus === "applied" && status === "in-progress") {
      application.approvedThrough = 1;
    } else if (previousStatus === "in-progress" && status === "selected") {
      if (application.currentRound < application.jobId.rounds.length) {
        return error(res, "尚有未完成的面试轮次，不能标记为通过", 409);
      }
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
    if (!application.candidateId?._id.equals(req.user.id)) {
      return error(res, "无权提交该申请的面试结果", 403);
    }

    const rn = Number(roundNumber);
    if (!Number.isInteger(rn) || rn < 1) {
      return error(res, "轮次编号无效", 400);
    }

    const totalRounds = Array.isArray(application.jobId?.rounds)
      ? application.jobId.rounds.length
      : 0;
    if (application.status !== "in-progress" || rn !== application.currentRound + 1 || rn > totalRounds) {
      return error(res, "当前轮次不可提交，请按企业已开启的顺序完成面试", 409);
    }
    if (rn > application.approvedThrough || application.history.some((item) => item.roundNumber === rn)) {
      return error(res, "该轮尚未开启或已提交结果", 409);
    }

    const interview = await Interview.findOne({
      _id: interviewId,
      student: req.user.id,
      type: "company",
      applicationId: application._id,
      jobId: application.jobId._id,
      roundNumber: rn,
    });
    if (!interview || interview.result !== result) {
      return error(res, "面试记录与当前申请或轮次不匹配", 400);
    }

    application.history.push({
      roundNumber: rn,
      interviewId: interviewId || null,
      result,
      feedback: feedback || "",
    });

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
