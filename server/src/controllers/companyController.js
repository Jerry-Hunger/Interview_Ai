import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import logger from "../utils/logger.js";
import { success, error } from "../utils/apiResponse.js";

export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id;

    const jobs = await JobOpening.find({ companyId })
      .select("title status rounds createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const jobIds = jobs.map((job) => job._id);
    const stats = {
      totalJobs: jobs.length,
      totalApplications: 0,
      applied: 0,
      inProgress: 0,
      selected: 0,
      finalSelected: 0,
      rejected: 0,
    };

    // 统计由 MongoDB 聚合完成，避免仪表盘将全部申请记录加载到 Node 进程后再筛选。
    const [statusStats, recentApplications] = await Promise.all([
      Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Application.find({ jobId: { $in: jobIds } })
        .select("candidateId jobId status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("candidateId", "fullName email")
        .populate("jobId", "title")
        .lean(),
    ]);
    for (const item of statusStats) {
      stats.totalApplications += item.count;
      if (item._id === "in-progress") stats.inProgress = item.count;
      else if (item._id === "final-selected") stats.finalSelected = item.count;
      else if (item._id in stats) stats[item._id] = item.count;
    }

    success(res, {
      stats,
      jobs,
      recentApplications,
    });
  } catch (err) {
    logger.error({ err }, "获取仪表盘数据失败");
    error(res, "获取仪表盘数据失败");
  }
};

export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select("-password");
    if (!company) {
      return error(res, "企业不存在", 404);
    }
    success(res, { company });
  } catch (err) {
    logger.error({ err }, "获取企业信息失败");
    error(res, "服务器错误");
  }
};

export const updateCompanyProfile = async (req, res) => {
  try {
    const {
      companyName,
      companyDescription,
      companyLocation,
      companyLocationCoords,
      companyWebsite,
      industry,
      companySize,
      roleOffered,
    } = req.body;

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
    if (companyLocation !== undefined) updateData.companyLocation = companyLocation;
    if (companyLocationCoords !== undefined) updateData.companyLocationCoords = companyLocationCoords;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
    if (industry !== undefined) updateData.industry = industry;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (roleOffered !== undefined) updateData.roleOffered = roleOffered;

    const company = await Company.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    success(res, { company });
  } catch (err) {
    logger.error({ err }, "更新企业信息失败");
    error(res, "服务器错误");
  }
};

export const deleteCompanyPhoto = async (req, res) => {
  try {
    const { url } = req.body;
    const company = await Company.findById(req.user.id);

    if (!company) {
      return error(res, "企业不存在", 404);
    }

    const photos = (company.companyPhotos || []).filter(p => p !== url);
    await Company.findByIdAndUpdate(req.user.id, { companyPhotos: photos });

    success(res, { message: "企业照片已删除" });
  } catch (err) {
    logger.error({ err }, "删除照片失败");
    error(res, "服务器错误");
  }
};
