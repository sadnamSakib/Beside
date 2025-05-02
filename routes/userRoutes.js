const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// Protect all routes after this middleware
router.use(authController.protect);

// Get Current User Profile
router.get("/profile", userController.getUserProfile);

// Update User Profile
router.put("/profile", userController.updateUserProfile);

// Delete User Profile
router.delete("/profile", userController.deleteUserProfile);

// Update Consent
router.post("/consent", userController.updateConsent);

// Upload Profile Photo
router.post("/profilePhoto", userController.uploadProfilePhoto);

module.exports = router;
