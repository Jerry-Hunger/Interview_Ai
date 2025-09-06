import JobOpening from "../models/JobOpening.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

export const createJob = async (req, res) => {
  try {
    const { title, description, skills, rounds, status } = req.body;

    // Basic validation
    if (!title || !description) {
      return res
        .status(400)
        .json({ msg: "Title and description are required" });
    }

    if (!Array.isArray(rounds) || rounds.length === 0) {
      return res
        .status(400)
        .json({ msg: "At least one interview round is required" });
    }
    // Create job opening
    const job = new JobOpening({
      companyId: req.user.id, // from authMiddleware
      title,
      description,
      skills: skills || [],
      rounds,
      status: status || "open",
    });

    await job.save();

    res.status(201).json({
      msg: "Job created successfully",
      job,
    });
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ msg: "Server error while creating job" });
  }
};

export const listJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching jobs" });
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
    if (existing) return res.status(400).json({ msg: "Already applied" });

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
    res.status(500).json({ msg: "Error applying", err });
  }
};

export const getApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const apps = await Application.find({ jobId }).populate("candidateId");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching applications" });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "selected" | "rejected"

    const app = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(app);
  } catch (err) {
    res.status(500).json({ msg: "Error updating application", err });
  }
};

export const getJobDetail = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(jobId);
    const job = await JobOpening.findById(jobId);
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching job details", err });
  }
};

export const companyJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find({ companyId: req.user.id });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching company jobs", err });
  }
};
