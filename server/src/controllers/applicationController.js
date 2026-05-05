import Application from "../models/Application.js";
import { createApplicationForStudent } from "../services/applicationService.js";
import { success, error } from "../utils/apiResponse.js";
import { sendInterviewApprovalEmail } from "../utils/emailService.js";

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

    // 如果申请的 resumeId 为空，尝试获取学生当前的简历
    const Student = (await import("../models/Student.js")).default;
    const Resume = (await import("../models/Resume.js")).default;
    const student = await Student.findById(candidateId);

    for (const app of applications) {
      if (!app.resumeId && student?.resumeId) {
        const resume = await Resume.findById(student.resumeId);
        if (resume) {
          app.resumeId = resume;
        }
      }
    }

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

    // 如果申请的 resumeId 为空，尝试获取学生当前的简历
    const Student = (await import("../models/Student.js")).default;
    const Resume = (await import("../models/Resume.js")).default;

    for (const app of applications) {
      if (!app.resumeId && app.candidateId?._id) {
        const student = await Student.findById(app.candidateId._id);
        if (student?.resumeId) {
          const resume = await Resume.findById(student.resumeId);
          if (resume) {
            app.resumeId = resume;
          }
        }
      }
    }

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

    // 如果申请的 resumeId 为空或不存在，尝试获取学生当前的简历
    if (!application.resumeId && application.candidateId?._id) {
      const Student = (await import("../models/Student.js")).default;
      const student = await Student.findById(application.candidateId._id);
      if (student?.resumeId) {
        const Resume = (await import("../models/Resume.js")).default;
        const resume = await Resume.findById(student.resumeId);
        if (resume) {
          application.resumeId = resume;
        }
      }
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

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");
    if (!application) {
      return error(res, "申请记录不存在", 404);
    }

    const previousStatus = application.status;  // 记录旧状态

    // 当企业点击"开启下一轮"时（in-progress -> in-progress），
    // 增加 approvedThrough 表示企业已批准至该轮
    // approvedThrough 字段用于追踪企业已批准的轮次
    if (previousStatus === "in-progress" && status === "in-progress") {
      application.approvedThrough = (application.approvedThrough || 0) + 1;
    }
    // 当企业从 applied 变为 in-progress 时，初始化 approvedThrough 为 1（前瞻第一轮）
    if (previousStatus === "applied" && status === "in-progress") {
      application.approvedThrough = 1;
    }
    // 当企业将状态从 in-progress 设为 selected 时（最终批准），也需要增加 approvedThrough
    if (previousStatus === "in-progress" && status === "selected") {
      application.approvedThrough = (application.approvedThrough || 0) + 1;
    }

    application.status = status;
    await application.save();

    // 当状态从 "applied" 变为 "in-progress" 时，发送面试批准邮件
    if (previousStatus === "applied" && status === "in-progress") {
      const candidate = application.candidateId;
      const job = application.jobId;

      if (candidate?.email) {
        const Company = (await import("../models/Company.js")).default;
        const company = await Company.findById(job?.companyId).select("companyName");

        sendInterviewApprovalEmail(
          candidate.email,
          candidate.fullName || "",
          company?.companyName || "本公司",
          job?.title || "该职位"
        ).catch(err => {
          console.error("Async email send error:", err);
        });
      }
    }

    const updated = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId")
      .populate("resumeId");

    success(res, { message: "状态更新成功", application: updated });
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
