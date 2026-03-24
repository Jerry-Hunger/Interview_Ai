// server/src/routes/companyRoutes.js
import express from "express";
import { 
  getCompanyDashboard, 
  getCompanyProfile, 
  updateCompanyProfile,
  deleteCompanyPhoto 
} from "../controllers/companyController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware("company"), getCompanyDashboard);
router.get("/profile", authMiddleware("company"), getCompanyProfile);
router.put("/profile", authMiddleware("company"), updateCompanyProfile);
router.delete("/photos", authMiddleware("company"), deleteCompanyPhoto);

export default router;
