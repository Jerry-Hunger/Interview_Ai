// routes/jobRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createJob,
  listJobs,
  applyJob,
  getApplications,
  updateApplicationStatus,
  getJobDetail,
  companyJobs,
} from "../controllers/jobController.js";

const router = express.Router();

// Company creates job with rounds
router.post("/", authMiddleware(["company"]), createJob);

// Candidate views available jobs
router.get("/", authMiddleware(["student"]), listJobs);

router.get("/company", authMiddleware(["company"]), companyJobs);

// Candidate applies (with resume upload)
router.post("/:jobId/apply", authMiddleware(["student"]), applyJob);

router.get("/:jobId", authMiddleware(["student", "company"]), getJobDetail);

// Company views applications
router.get(
  "/:jobId/applications",
  authMiddleware(["company"]),
  getApplications
);

// Company approves/rejects final
router.patch(
  "/applications/:id/status",
  authMiddleware(["company"]),
  updateApplicationStatus
);

export default router;
