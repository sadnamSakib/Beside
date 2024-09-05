const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/login", authController.login);
router.get("/current-user", authController.protect, authController.currentUser);
router.get("/logout", authController.protect, authController.logout);

module.exports = router;
