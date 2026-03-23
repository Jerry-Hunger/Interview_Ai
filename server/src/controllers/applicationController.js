import Application from "../models/Application.js";
import User from "../models/User.js";

export const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const { resumeText } = await User.findOne({ _id: req.user.id });

    const exists = await Application.findOne({
      jobId,
      userId: req.user.id,
    });
    if (exists) {
      return res.status(400).json({ msg: "您已申请过该职位" });
    }

    const application = new Application({
      jobId,
      status: "applied",
      currentRound: 0,
      jobId,
      candidateId: req.user.id,
      resumeText,
      history: [],
    });

    await application.save();
    res.status(201).json(application);
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ msg: "服务器错误" });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("userId");
    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ msg: "服务器错误" });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ msg: "未授权" });

    const applications = await Application.find({ candidateId: userId })
      .populate("jobId")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (err) {
    console.error("getMyApplications error:", err);
    return res.status(500).json({ msg: "服务器错误" });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId }).populate(
      "candidateId"
    );
    res.json(applications);
  } catch (err) {
    console.error("Error fetching job applications:", err);
    res.status(500).json({ msg: "服务器错误" });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");

    if (!application) {
      return res.status(404).json({ message: "申请记录不存在" });
    }
    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "服务器错误" });
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
      return res.status(400).json({ message: "无效的状态值" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "申请记录不存在" });
    }

    application.status = status;
    await application.save();

    res.json({ message: "状态更新成功", application });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "服务器错误" });
  }
};

export const addRoundResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roundNumber, interviewId, result, feedback } = req.body;

    if (!["success", "failure"].includes(result)) {
      return res
        .status(400)
        .json({ msg: "结果值无效，请使用 'success' 或 'failure'" });
    }

    const application = await Application.findById(applicationId).populate(
      "jobId"
    );
    if (!application) {
      return res.status(404).json({ msg: "申请记录不存在" });
    }

    const rn = Number(roundNumber);
    if (!rn || rn < 1) {
      console.error("Invalid roundNumber:", roundNumber);
      return res.status(400).json({ msg: "轮次编号无效" });
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
      .populate("candidateId");

    return res.json({
      msg: "轮次结果保存成功",
      application: updated,
    });
  } catch (err) {
    console.error("addRoundResult error:", err.message);
    return res.status(500).json({ msg: "服务器错误", error: err.message });
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
