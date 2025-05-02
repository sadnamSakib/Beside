const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

/**
 * Model for dummy verification data
 */
const DummyVerificationSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Only create the model if it doesn't exist
const DummyVerification =
  mongoose.models.DummyVerification ||
  mongoose.model("DummyVerification", DummyVerificationSchema);

/**
 * Check if in development environment
 */
const checkDevEnvironment = (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return next(
      new AppError("This endpoint is only available in development mode", 403)
    );
  }
  next();
};

/**
 * Create dummy verification data
 * @route POST /api/v1/system/createDummyData
 */
const createDummyData = catchAsync(async (req, res, next) => {
  const verificationData = req.body;

  if (!Array.isArray(verificationData) && !verificationData.idNumber) {
    return next(new AppError("Please provide valid verification data", 400));
  }

  let result;

  // Handle both single object and array of objects
  if (Array.isArray(verificationData)) {
    result = await DummyVerification.insertMany(verificationData);
  } else {
    result = await DummyVerification.create(verificationData);
  }

  res.status(201).json({
    status: "success",
    data: {
      result,
    },
  });
});

/**
 * Append to existing dummy data
 * @route POST /api/v1/system/appendDummyData
 */
const appendDummyData = catchAsync(async (req, res, next) => {
  const verificationData = req.body;

  if (!Array.isArray(verificationData)) {
    return next(
      new AppError("Please provide an array of verification data", 400)
    );
  }

  const result = await DummyVerification.insertMany(verificationData);

  res.status(200).json({
    status: "success",
    data: {
      result,
    },
  });
});

/**
 * Update existing dummy data
 * @route PUT /api/v1/system/updateDummyData/:idNumber
 */
const updateDummyData = catchAsync(async (req, res, next) => {
  const { idNumber } = req.params;
  const updateData = req.body;

  if (!idNumber) {
    return next(new AppError("Please provide an ID number", 400));
  }

  const result = await DummyVerification.findOneAndUpdate(
    { idNumber },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    return next(new AppError("No dummy data found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      result,
    },
  });
});

/**
 * Delete dummy data
 * @route DELETE /api/v1/system/deleteDummyData/:idNumber
 */
const deleteDummyData = catchAsync(async (req, res, next) => {
  const { idNumber } = req.params;

  if (!idNumber) {
    return next(new AppError("Please provide an ID number", 400));
  }

  const result = await DummyVerification.findOneAndDelete({ idNumber });

  if (!result) {
    return next(new AppError("No dummy data found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get all dummy verification data
 * @route GET /api/v1/system/dummyData
 */
const getDummyData = catchAsync(async (req, res, next) => {
  const result = await DummyVerification.find();

  res.status(200).json({
    status: "success",
    results: result.length,
    data: {
      verifications: result,
    },
  });
});

/**
 * Verify ID against dummy database - this mimics the external verification service
 * This is for internal use by the auth controller
 * @param {string} idNumber - ID number to verify
 * @param {string} firstName - First name to verify
 * @param {string} lastName - Last name to verify
 * @param {Date} dateOfBirth - Date of birth to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyIdAgainstDummy = async (
  idNumber,
  firstName,
  lastName,
  dateOfBirth
) => {
  // Find the record in our dummy database
  const record = await DummyVerification.findOne({ idNumber });

  if (!record) {
    return {
      verified: false,
      reason: "ID number not found in records",
    };
  }

  // Check if the record is marked as valid
  if (!record.isValid) {
    return {
      verified: false,
      reason: "ID is marked as invalid",
    };
  }

  // Check name matching (case insensitive)
  if (
    record.firstName.toLowerCase() !== firstName.toLowerCase() ||
    record.lastName.toLowerCase() !== lastName.toLowerCase()
  ) {
    return {
      verified: false,
      reason: "Name does not match records",
    };
  }

  // Convert both dates to comparable strings
  const recordDOB = new Date(record.dateOfBirth).toISOString().split("T")[0];
  const inputDOB = new Date(dateOfBirth).toISOString().split("T")[0];

  // Check date of birth matching
  if (recordDOB !== inputDOB) {
    return {
      verified: false,
      reason: "Date of birth does not match records",
    };
  }

  // All checks passed
  return {
    verified: true,
    record: {
      idNumber: record.idNumber,
      name: `${record.firstName} ${record.lastName}`,
      verified: true,
    },
  };
};

// Export controller functions and the verification helper
module.exports = {
  checkDevEnvironment,
  createDummyData,
  appendDummyData,
  updateDummyData,
  deleteDummyData,
  getDummyData,
  verifyIdAgainstDummy,
};
