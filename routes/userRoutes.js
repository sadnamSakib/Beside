const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

// Public routes
router.post("/register", userController.registerUser);

// Protected routes
router.use(authController.protect);

router.get("/profile", userController.getUserProfile);
router.put("/profile", userController.updateUserProfile);
router.delete("/profile", userController.deleteUserAccount);

router.post("/consent", userController.updateConsent);
router.post("/profile-photo", userController.uploadProfilePhoto);

module.exports = router;
