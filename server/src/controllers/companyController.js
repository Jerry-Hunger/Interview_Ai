import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import Company from "../models/Company.js";

export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id;

    const jobs = await JobOpening.find({ companyId }).sort({ createdAt: -1 });

    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("candidateId", "fullName email")
      .populate("jobId", "title");

    const stats = {
      totalJobs: jobs.length,
      totalApplications: applications.length,
      applied: applications.filter((a) => a.status === "applied").length,
      inProgress: applications.filter((a) => a.status === "in-progress").length,
      selected: applications.filter((a) => a.status === "selected").length,
      finalSelected: applications.filter((a) => a.status === "final-selected")
        .length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };

    const recentApplications = await Application.find({
      jobId: { $in: jobIds },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("candidateId", "fullName email")
      .populate("jobId", "title");

    res.json({
      stats,
      jobs,
      recentApplications,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res
      .status(500)
      .json({ message: "获取仪表盘数据失败", error: err.message });
  }
};

export const getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select("-password");
    if (!company) {
      return res.status(404).json({ error: "企业不存在" });
    }
    res.json(company);
  } catch (err) {
    console.error("获取企业信息失败:", err);
    res.status(500).json({ error: "服务器错误" });
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
      { new: true }
    ).select("-password");

    res.json(company);
  } catch (err) {
    console.error("更新企业信息失败:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};

export const deleteCompanyPhoto = async (req, res) => {
  try {
    const { url } = req.body;
    const company = await Company.findById(req.user.id);

    if (!company) {
      return res.status(404).json({ error: "企业不存在" });
    }

    const photos = (company.companyPhotos || []).filter(p => p !== url);
    await Company.findByIdAndUpdate(req.user.id, { companyPhotos: photos });

    res.json({ success: true });
  } catch (err) {
    console.error("删除照片失败:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};
