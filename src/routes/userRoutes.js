// src/routes/userRoutes.js
import express from "express";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", userController.registerUser);

// Protected routes
router.use(authController.protect);

router.get("/profile", userController.getUserProfile);
router.put("/profile", userController.updateUserProfile);
router.delete("/profile", userController.deleteUserAccount);

router.post("/consent", userController.updateConsent);
router.post("/profile-photo", userController.uploadProfilePhoto);

export default router;
