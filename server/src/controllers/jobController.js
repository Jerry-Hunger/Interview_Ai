import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import { createApplicationForStudent } from "../services/applicationService.js";
import { success, error } from "../utils/apiResponse.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, skills, rounds, status } = req.body;

    if (!title || !description) {
      return error(res, "职位名称和描述不能为空", 400);
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return error(res, "至少需要添加一个面试环节", 400);
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

    success(res, { msg: "职位创建成功", job }, 201);
  } catch (err) {
    console.error("Error creating job:", err);
    error(res, "创建职位时发生错误");
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

    success(res, { jobs: formattedJobs });
  } catch (err) {
    console.error("Error listing jobs:", err);
    error(res, "获取职位列表失败");
  }
};

export const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user.id;
    const application = await createApplicationForStudent(candidateId, jobId);
    success(res, { application });
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    console.error("Error applying job:", err);
    error(res, "申请职位时发生错误");
  }
};

export const getApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const apps = await Application.find({ jobId })
      .populate("candidateId")
      .populate("resumeId");
    success(res, { applications: apps });
  } catch (err) {
    console.error("Error getting applications:", err);
    error(res, "获取申请列表失败");
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
    success(res, { application: app });
  } catch (err) {
    console.error("Error updating application status:", err);
    error(res, "更新申请状态失败");
  }
};

export const getJobDetail = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobOpening.findById(jobId).populate("companyId", "companyName companyLogoUrl companyLocation companySize industry companyWebsite companyDescription");
    if (!job) return error(res, "职位不存在", 404);

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

    success(res, { job: formattedJob });
  } catch (err) {
    console.error("Error getting job detail:", err);
    error(res, "获取职位详情失败");
  }
};

export const companyJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find({ companyId: req.user.id });
    success(res, { jobs });
  } catch (err) {
    console.error("Error getting company jobs:", err);
    error(res, "获取职位列表失败");
  }
};
