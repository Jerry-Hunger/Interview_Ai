import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createJob,
  listJobs,
  getJobDetail,
  companyJobs,
  updateJobStatus,
} from "../controllers/jobController.js";
import { validateCreateJob, validateJobId, validateJobStatus } from "../middlewares/validators/jobValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/", authMiddleware(["company"]), validateCreateJob, validate, createJob);
router.get("/", authMiddleware(["student"]), listJobs);
router.get("/company", authMiddleware(["company"]), companyJobs);
router.get("/:jobId", authMiddleware(["student", "company"]), validateJobId, validate, getJobDetail);
router.patch("/:jobId/status", authMiddleware(["company"]), validateJobStatus, validate, updateJobStatus);

export default router;
