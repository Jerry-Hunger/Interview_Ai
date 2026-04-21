import express from "express";
import {
  getCompanyDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  deleteCompanyPhoto,
} from "../controllers/companyController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateUpdateProfile } from "../middlewares/validators/companyValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.get("/dashboard", authMiddleware("company"), getCompanyDashboard);
router.get("/profile", authMiddleware("company"), getCompanyProfile);
router.put("/profile", authMiddleware("company"), validateUpdateProfile, validate, updateCompanyProfile);
router.delete("/photos", authMiddleware("company"), deleteCompanyPhoto);

export default router;
