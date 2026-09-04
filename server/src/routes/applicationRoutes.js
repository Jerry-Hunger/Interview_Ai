import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createApplication,
  getMyApplications,
  getMyAppliedJobIds,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  addRoundResult,
} from "../controllers/applicationController.js";
import {
  validateCreateApplication,
  validateUpdateStatus,
  validateAddRoundResult,
  validateJobApplications,
  validateApplicationId,
} from "../middlewares/validators/applicationValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/", authMiddleware("student"), validateCreateApplication, validate, createApplication);
router.get("/mine", authMiddleware("student"), getMyApplications);
router.get("/mine/job-ids", authMiddleware("student"), getMyAppliedJobIds);
router.get("/job/:jobId", authMiddleware("company"), validateJobApplications, validate, getJobApplications);

router.get("/:applicationId", authMiddleware(["student", "company"]), validateApplicationId, validate, getApplicationById);
router.post("/:applicationId/round", authMiddleware("student"), validateAddRoundResult, validate, addRoundResult);
router.patch("/:applicationId", authMiddleware("company"), validateUpdateStatus, validate, updateApplicationStatus);

export default router;
