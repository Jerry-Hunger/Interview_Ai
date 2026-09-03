import express from "express";
import { register, login, logout, me, updateProfile, githubLogin, githubCallback } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateRegister, validateLogin } from "../middlewares/validators/authValidators.js";
import validate from "../middlewares/validators/validate.js";

const router = express.Router();

router.post("/register", validateRegister, validate, register);
router.post("/login", validateLogin, validate, login);
router.post("/logout", logout);
router.get("/me", authMiddleware(), me);
router.put("/profile", authMiddleware(), updateProfile);

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

export default router;
