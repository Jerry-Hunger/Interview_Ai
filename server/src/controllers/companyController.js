import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { success, error } from "../utils/apiResponse.js";

export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id;

    const stats = {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      applied: 0,
      inProgress: 0,
      selected: 0,
      finalSelected: 0,
      rejected: 0,
    };

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    // 所有统计、近期申请和活跃职位均由数据库完成，避免加载企业全部职位或申请到 Node 进程。
    const [jobSummary, applicationSummary] = await Promise.all([
      JobOpening.aggregate([
        { $match: { companyId: companyObjectId } },
        {
          $facet: {
            counts: [{ $group: { _id: null, totalJobs: { $sum: 1 }, activeJobs: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } } } }],
            activeJobs: [
              { $match: { status: "open" } },
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              { $project: { title: 1, description: 1, status: 1, createdAt: 1 } },
            ],
          },
        },
      ]),
      Application.aggregate([
        { $lookup: { from: JobOpening.collection.name, localField: "jobId", foreignField: "_id", as: "job" } },
        { $unwind: "$job" },
        { $match: { "job.companyId": companyObjectId } },
        {
          $facet: {
            statusStats: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            recentApplications: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              { $project: { candidateId: 1, jobId: 1, status: 1, createdAt: 1 } },
            ],
          },
        },
      ]),
    ]);
    const counts = jobSummary[0]?.counts[0];
    stats.totalJobs = counts?.totalJobs || 0;
    stats.activeJobs = counts?.activeJobs || 0;
    const statusStats = applicationSummary[0]?.statusStats || [];
    const recentApplications = await Application.populate(applicationSummary[0]?.recentApplications || [], [
      { path: "candidateId", select: "fullName email" },
      { path: "jobId", select: "title" },
    ]);
    for (const item of statusStats) {
      stats.totalApplications += item.count;
      if (item._id === "in-progress") stats.inProgress = item.count;
      else if (item._id === "final-selected") stats.finalSelected = item.count;
      else if (item._id in stats) stats[item._id] = item.count;
    }

    success(res, {
      stats,
      jobs: jobSummary[0]?.activeJobs || [],
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
