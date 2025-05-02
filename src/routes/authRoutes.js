// src/routes/authRoutes.js
import express from "express";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword/:token", authController.resetPassword);
router.get("/verifyEmail/:token", authController.verifyEmail);
router.get("/logout", authController.logout);

// Protected routes
router.use(authController.protect);
router.post("/verify", authController.verifyUser);
router.get("/current-user", authController.currentUser);
router.post("/send-verification-email", authController.sendVerificationEmail);

export default router;
