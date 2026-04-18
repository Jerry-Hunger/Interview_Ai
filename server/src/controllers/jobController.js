import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Student from "../models/Student.js";

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

    const companyId = req.user.id;
    const company = await Company.findById(companyId);

    const job = new JobOpening({
      companyId,
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
    const { company, rounds, type, status } = req.query;

    const filter = {};

    if (rounds) {
      if (rounds === '4+') {
        filter['rounds'] = { $size: { $gte: 4 } };
      } else {
        filter['rounds'] = { $size: parseInt(rounds) };
      }
    }

    if (type) {
      const types = type.split(',');
      filter['rounds.type'] = { $in: types };
    }

    if (status) {
      filter.status = status;
    }

    let jobs;
    if (company) {
      const companies = await Company.find({
        companyName: new RegExp(company, 'i')
      }).select('_id');
      const companyIds = companies.map(c => c._id);
      filter.companyId = { $in: companyIds };
      jobs = await JobOpening.find(filter)
        .populate("companyId", "companyName companyLogoUrl companyLocation")
        .sort({ createdAt: -1 });
    } else {
      jobs = await JobOpening.find(filter)
        .populate("companyId", "companyName companyLogoUrl companyLocation")
        .sort({ createdAt: -1 });
    }

    const formattedJobs = jobs.map(job => ({
      ...job.toObject(),
      companyName: job.companyId?.companyName,
      companyLogoUrl: job.companyId?.companyLogoUrl,
      companyLocation: job.companyId?.companyLocation,
    }));

    res.json(formattedJobs);
  } catch (err) {
    res.status(500).json({ msg: "获取职位列表失败" });
  }
};

export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;

    const student = await Student.findById(candidateId);
    if (!student) {
      return res.status(404).json({ msg: "学生不存在" });
    }

    const existing = await Application.findOne({
      jobId,
      candidateId,
    });
    if (existing) return res.status(400).json({ msg: "您已申请过该职位" });

    const application = await Application.create({
      jobId,
      candidateId,
      resumeId: student.resumeId || null,
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
    const apps = await Application.find({ jobId })
      .populate("candidateId")
      .populate("resumeId");
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
    const job = await JobOpening.findById(jobId).populate("companyId", "companyName companyLogoUrl companyLocation companySize industry companyWebsite companyDescription");
    if (!job) return res.status(404).json({ msg: "职位不存在" });

    const formattedJob = {
      ...job.toObject(),
      companyName: job.companyId?.companyName,
      companyLogoUrl: job.companyId?.companyLogoUrl,
      companyLocation: job.companyId?.companyLocation,
      companySize: job.companyId?.companySize,
      industry: job.companyId?.industry,
      companyWebsite: job.companyId?.companyWebsite,
      companyDescription: job.companyId?.companyDescription,
    };

    res.json(formattedJob);
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
