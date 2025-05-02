const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");
const authController = require("../controllers/authController");

// Middleware to ensure these routes only work in development
router.use(systemController.checkDevEnvironment);

// Additional protection with admin access only
router.use(authController.protect);
router.use(authController.restrictTo("Admin"));

// System routes for dummy verification data management
router
  .route("/dummyData")
  .get(systemController.getDummyData)
  .post(systemController.createDummyData);

router.post("/appendDummyData", systemController.appendDummyData);

router
  .route("/dummyData/:idNumber")
  .put(systemController.updateDummyData)
  .delete(systemController.deleteDummyData);

module.exports = router;
