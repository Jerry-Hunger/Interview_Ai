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
  updateJobStatus,
} from "../controllers/jobController.js";
import { validateCreateJob, validateApplyJob } from "../middlewares/validators/jobValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/", authMiddleware(["company"]), validateCreateJob, validate, createJob);
router.get("/", authMiddleware(["student"]), listJobs);
router.get("/company", authMiddleware(["company"]), companyJobs);
router.post("/:jobId/apply", authMiddleware(["student"]), validateApplyJob, validate, applyJob);
router.get("/:jobId", authMiddleware(["student", "company"]), getJobDetail);
router.get("/:jobId/applications", authMiddleware(["company"]), getApplications);
router.patch("/:jobId/status", authMiddleware(["company"]), updateJobStatus);
router.patch("/applications/:id/status", authMiddleware(["company"]), updateApplicationStatus);

export default router;
