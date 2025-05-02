// src/routes/systemRoutes.js
import express from "express";
import * as systemController from "../controllers/systemController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

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

export default router;
