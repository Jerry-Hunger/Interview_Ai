// routes/applications.ts
import express from "express";
import Application from "../models/Application.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ Create new application
export const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const { resumeText } = await User.findOne({ _id: req.user.id });

    // Prevent duplicate applications
    const exists = await Application.findOne({
      jobId,
      userId: req.user.id,
    });
    if (exists) {
      return res.status(400).json({ msg: "Already applied to this job" });
    }

    const application = new Application({
      jobId,
      status: "applied",
      currentRound: 0,
      jobId,
      candidateId: req.user.id,
      resumeText,
      history: [],
    });

    await application.save();
    console.log("Application created:", application);
    res.status(201).json(application);
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get all applications (admin use case)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("jobId")
      .populate("userId");
    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ msg: "Unauthorized" });

    // If user role is company, they might want company postings – but here we return candidate's apps
    const applications = await Application.find({ candidateId: userId })
      .populate("jobId")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (err) {
    console.error("getMyApplications error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId }).populate(
      "candidateId"
    );
    res.json(applications);
  } catch (err) {
    console.error("Error fetching job applications:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Fetch single application with job + candidate info
export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update application status (approve, reject, final-select, etc.)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "applied",
      "in-progress",
      "selected",
      "final-selected",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = status;
    await application.save();

    res.json({ message: "Status updated successfully", application });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Add a round result for an application and update application status/currentRound
 * POST /applications/:applicationId/round
 * Body: { roundNumber, interviewId (optional), result: "success"|"failure", feedback (optional) }
 */
// ✅ adjust path

export const addRoundResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { roundNumber, interviewId, result, feedback } = req.body;

    // ✅ Validate result
    if (!["success", "failure"].includes(result)) {
      return res
        .status(400)
        .json({ msg: "Invalid result; use 'success' or 'failure'." });
    }

    // ✅ Find application with job
    const application = await Application.findById(applicationId).populate(
      "jobId"
    );
    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    // ✅ Ensure roundNumber is valid
    const rn = Number(roundNumber);
    if (!rn || rn < 1) {
      console.error("Invalid roundNumber:", roundNumber);
      return res.status(400).json({ msg: "Invalid roundNumber" });
    }

    // ✅ Add round history
    application.history.push({
      roundNumber: rn,
      interviewId: interviewId || null,
      result,
      feedback: feedback || "",
    });

    // ✅ Total rounds from job
    const totalRounds = Array.isArray(application.jobId?.rounds)
      ? application.jobId.rounds.length
      : 0;

    // ✅ Update round + status
    if (result === "success") {
      application.currentRound = rn; // ✅ update to this round number

      if (totalRounds > 0 && rn >= totalRounds) {
        // Candidate cleared all rounds → "selected"
        application.status = "selected";
      } else {
        // More rounds left → still "in-progress"
        application.status = "in-progress";
      }
    } else {
      // ❌ failure → rejected
      application.status = "rejected";
    }

    await application.save();

    // ✅ Return populated object
    const updated = await Application.findById(applicationId)
      .populate("jobId")
      .populate("candidateId");

    return res.json({
      msg: "Round result saved successfully",
      application: updated,
    });
  } catch (err) {
    console.error("addRoundResult error:", err.message);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/**
 * Get all applications for a job (for company view)
 * GET /applications/job/:jobId
 */

/**
 * Get applications for the logged-in user
 * GET /applications/mine
 */

export default {
  createApplication,
  getAllApplications,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  addRoundResult,
};
