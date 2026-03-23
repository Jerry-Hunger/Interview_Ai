import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, skills, rounds, status } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ msg: "职位名称和描述不能为空" });
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return res
        .status(400)
        .json({ msg: "至少需要添加一个面试环节" });
    }
    const job = new JobOpening({
      companyId: req.user.id,
      title,
      description,
      skills: skills || [],
      rounds,
      status: status || "open",
    });

    await job.save();

    res.status(201).json({
      msg: "职位创建成功",
      job,
    });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ msg: "创建职位时发生错误" });
  }
};

export const listJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "获取职位列表失败" });
  }
};

export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeText } = await User.findOne({ _id: req.user.id });

    const existing = await Application.findOne({
      jobId,
      candidateId: req.user.id,
    });
    if (existing) return res.status(400).json({ msg: "您已申请过该职位" });

    const application = await Application.create({
      jobId,
      candidateId: req.user.id,
      resumeText,
      currentRound: 0,
      status: "applied",
      history: [],
    });

    res.json(application);
  } catch (err) {
    res.status(500).json({ msg: "申请职位时发生错误", err });
  }
};

export const getApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const apps = await Application.find({ jobId }).populate("candidateId");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "获取申请列表失败" });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const app = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(app);
  } catch (err) {
    res.status(500).json({ msg: "更新申请状态失败", err });
  }
};

export const getJobDetail = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobOpening.findById(jobId);
    if (!job) return res.status(404).json({ msg: "职位不存在" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: "获取职位详情失败", err });
  }
};

export const companyJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find({ companyId: req.user.id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "获取职位列表失败", err });
  }
};
