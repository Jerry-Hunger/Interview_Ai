// server/src/routes/companyRoutes.js
import express from "express";
import { getCompanyDashboard } from "../controllers/companyController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /company/dashboard
router.get("/dashboard", authMiddleware("company"), getCompanyDashboard);

export default router;
