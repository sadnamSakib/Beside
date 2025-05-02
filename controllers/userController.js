const User = require("../models/userModel");
const authController = require("./authController");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

/**
 * Get current user's profile
 */
exports.getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password -__v");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Update current user's profile
 */
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const { userName, email, mobileNo } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { userName, email, mobileNo },
    { new: true, runValidators: true }
  ).select("-password -__v");

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Delete current user's profile
 */
exports.deleteUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(204).json({
    status: "success",
    message: "User deleted successfully",
    data: null,
  });
});

/**
 * Update user's consent to Terms & Conditions
 */
exports.updateConsent = catchAsync(async (req, res, next) => {
  const { consentAccepted } = req.body;

  if (typeof consentAccepted !== "boolean") {
    return next(new AppError("Consent must be true or false", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { consentAccepted },
    { new: true, runValidators: true }
  ).select("-password -__v");

  res.status(200).json({
    status: "success",
    message: "Consent updated successfully",
    data: {
      user,
    },
  });
});

/**
 * Upload user profile photo (simple way)
 */
exports.uploadProfilePhoto = catchAsync(async (req, res, next) => {
  const { profilePhoto } = req.body; // Assume frontend sends photo URL for now

  if (!profilePhoto) {
    return next(new AppError("Please provide profile photo URL", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto },
    { new: true, runValidators: true }
  ).select("-password -__v");

  res.status(200).json({
    status: "success",
    message: "Profile photo updated successfully",
    data: {
      user,
    },
  });
});
