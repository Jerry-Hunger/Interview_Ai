// routes/applications.ts
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createApplication,
  getAllApplications,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  addRoundResult,
} from "../controllers/applicationController.js";

const router = express.Router();

// ✅ Create new application
router.post("/", authMiddleware("student"), createApplication);

// ✅ Get all applications (admin use case)
router.get("/", authMiddleware("admin"), getAllApplications);

// ✅ Get applications of logged-in user
router.get("/mine", authMiddleware("student"), getMyApplications);

router.get("/job/:jobId", authMiddleware("company"), getJobApplications);
router.get(
  "/:applicationId",
  authMiddleware(["student", "company"]),
  getApplicationById
);

router.post("/:applicationId/round", authMiddleware("student"), addRoundResult);

// ✅ Update application status
router.patch(
  "/:applicationId",
  authMiddleware("company"),
  updateApplicationStatus
);

export default router;
