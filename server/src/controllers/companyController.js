// server/src/controllers/companyController.js
import Job from "../models/JobOpening.js";
import Application from "../models/Application.js";

export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.id; // from JWT auth middleware

    // 1. Fetch jobs posted by company
    const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });

    // 2. Fetch applications for company's jobs
    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("candidateId", "name email")
      .populate("jobId", "title");

    // 3. Stats
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

    // 4. Recent Applications (latest 5)
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
      .json({ message: "Error fetching dashboard", error: err.message });
  }
};
