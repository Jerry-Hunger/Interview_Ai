import JobOpening from "../models/JobOpening.js";
import Company from "../models/Company.js";
import logger from "../utils/logger.js";
import { success, error } from "../utils/apiResponse.js";
import { getPagination, toPaginationMeta } from "../utils/pagination.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, skills, rounds, status } = req.body;

    if (!title || !description) {
      return error(res, "职位名称和描述不能为空", 400);
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return error(res, "至少需要添加一个面试环节", 400);
    }
    if (rounds.some((round, index) => Number(round.roundNumber) !== index + 1)) {
      return error(res, "面试轮次必须从 1 开始连续编号", 400);
    }

    const companyId = req.user.id;

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
    logger.error({ err }, "创建职位失败");
    error(res, "创建职位时发生错误");
  }
};

export const listJobs = async (req, res) => {
  try {
    const { company, rounds, type, status } = req.query;
    const pagination = getPagination(req.query);

    const filter = {};

    if (rounds) {
      if (rounds === '4+') {
        // $size 不支持比较运算符，使用 $expr 才能正确筛选四轮及以上职位。
        filter.$expr = { $gte: [{ $size: "$rounds" }, 4] };
      } else {
        const roundCount = Number.parseInt(rounds, 10);
        if (Number.isInteger(roundCount) && roundCount > 0) {
          filter.rounds = { $size: roundCount };
        }
      }
    }

    if (type) {
      const types = type.split(',');
      filter['rounds.type'] = { $in: types };
    }

    if (status) {
      filter.status = status;
    }

    if (company) {
      const companies = await Company.find({
        companyName: new RegExp(company, 'i')
      }).select('_id');
      filter.companyId = { $in: companies.map(c => c._id) };
    }

    const [jobs, total] = await Promise.all([
      JobOpening.find(filter)
      .populate("companyId", "companyName companyLogoUrl companyLocation")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean(),
      JobOpening.countDocuments(filter),
    ]);

    const formattedJobs = jobs.map(job => ({
      ...job,
      companyName: job.companyId?.companyName,
      companyLogoUrl: job.companyId?.companyLogoUrl,
      companyLocation: job.companyId?.companyLocation,
    }));

    success(res, { jobs: formattedJobs, pagination: toPaginationMeta(pagination, total) });
  } catch (err) {
    logger.error({ err }, "获取职位列表失败");
    error(res, "获取职位列表失败");
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
    logger.error({ err }, "获取职位详情失败");
    error(res, "获取职位详情失败");
  }
};

export const companyJobs = async (req, res) => {
  try {
    const pagination = getPagination(req.query);
    const filter = { companyId: req.user.id };
    const [jobs, total] = await Promise.all([
      JobOpening.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean(),
      JobOpening.countDocuments(filter),
    ]);
    success(res, { jobs, pagination: toPaginationMeta(pagination, total) });
  } catch (err) {
    logger.error({ err }, "获取企业职位列表失败");
    error(res, "获取职位列表失败");
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!["open", "closed"].includes(status)) {
      return error(res, "无效的职位状态，仅支持 open 或 closed", 400);
    }

    const job = await JobOpening.findOne({ _id: jobId, companyId: req.user.id });
    if (!job) {
      return error(res, "职位不存在或无权操作", 404);
    }

    job.status = status;
    await job.save();

    success(res, { msg: `职位已${status === "open" ? "开启" : "关闭"}`, job });
  } catch (err) {
    logger.error({ err }, "更新职位状态失败");
    error(res, "更新职位状态失败");
  }
};
