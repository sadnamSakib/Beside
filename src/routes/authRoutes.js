// src/routes/authRoutes.js
import express from "express";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/verify", authController.protect, authController.verifyUser);
router.post("/forgotPassword", authController.forgotPassword);
router.get("/logout", authController.logout);
router.get("/current-user", authController.protect, authController.currentUser);

export default router;
