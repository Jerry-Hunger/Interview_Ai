import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createApplication,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  addRoundResult,
} from "../controllers/applicationController.js";
import {
  validateCreateApplication,
  validateUpdateStatus,
  validateAddRoundResult,
} from "../middlewares/validators/applicationValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/", authMiddleware("student"), validateCreateApplication, validate, createApplication);
router.get("/mine", authMiddleware("student"), getMyApplications);
router.get("/job/:jobId", authMiddleware("company"), getJobApplications);

router.get("/:applicationId", authMiddleware(["student", "company"]), getApplicationById);
router.post("/:applicationId/round", authMiddleware("student"), validateAddRoundResult, validate, addRoundResult);
router.patch("/:applicationId", authMiddleware("company"), validateUpdateStatus, validate, updateApplicationStatus);

export default router;
