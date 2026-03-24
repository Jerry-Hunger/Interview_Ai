import express from "express";
import { register, login, me, updateProfile, githubLogin, githubCallback } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware(), me);
router.put("/profile", authMiddleware(), updateProfile);

router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

export default router;
