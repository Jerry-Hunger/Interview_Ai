import Job from "../models/JobOpening.js";
import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id;

    const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });

    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("candidateId", "name email")
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
      .populate("candidateId", "name email")
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
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }
    res.json(user);
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
    } = req.body;

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
    if (companyLocation !== undefined) updateData.companyLocation = companyLocation;
    if (companyLocationCoords !== undefined) updateData.companyLocationCoords = companyLocationCoords;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    await JobOpening.updateMany(
      { companyId: req.user.id },
      {
        companyName: user.companyName,
        companyLocation: user.companyLocation,
        companyLogoUrl: user.companyLogoUrl,
      }
    );

    res.json(user);
  } catch (err) {
    console.error("更新企业信息失败:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};

export const deleteCompanyPhoto = async (req, res) => {
  try {
    const { url } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }

    const photos = (user.companyPhotos || []).filter(p => p !== url);
    await User.findByIdAndUpdate(req.user.id, { companyPhotos: photos });

    res.json({ success: true });
  } catch (err) {
    console.error("删除照片失败:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};
