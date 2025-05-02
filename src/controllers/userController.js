// src/controllers/userController.js
import { User } from "../models/userModel.js";
import * as authController from "./authController.js";
import { passwordHash } from "../utils/passwordHash.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * Register a new user
 * @route POST /api/v1/user/register
 */
export const registerUser = catchAsync(async (req, res, next) => {
  const { userName, email, mobileNo, password, role } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (userExists) {
    return next(
      new AppError("User with this email or username already exists", 400)
    );
  }

  // Hash password
  const hashedPassword = await passwordHash(password);

  // Create user
  const user = await User.create({
    userName,
    email,
    password: hashedPassword,
    mobileNo,
    role: role || "User",
  });

  // Send verification email
  try {
    await authController.sendInitialVerificationEmail(user);
  } catch (error) {
    // Continue even if email sending fails
    console.error("Failed to send verification email:", error);
  }

  // Generate and send JWT token
  authController.createSendToken(user, 201, res);
});

/**
 * Get user profile
 * @route GET /api/v1/user/profile
 */
export const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

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
 * Update user profile
 * @route PUT /api/v1/user/profile
 */
export const updateUserProfile = catchAsync(async (req, res, next) => {
  const { profileSettings } = req.body;

  // Fields allowed to update
  const filteredBody = {};

  if (profileSettings) {
    filteredBody.profileSettings = profileSettings;
  }

  // Add other allowed fields as needed
  const allowedFields = ["mobileNo", "profilePhoto"];
  allowedFields.forEach((field) => {
    if (req.body[field]) {
      filteredBody[field] = req.body[field];
    }
  });

  // Update lastUpdated timestamp
  filteredBody.lastUpdated = Date.now();

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

/**
 * Update consent settings for a user
 * @route POST /api/v1/user/consent
 */
export const updateConsent = catchAsync(async (req, res, next) => {
  const { consent } = req.body;

  if (consent === undefined) {
    return next(new AppError("Consent value is required", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { consentGiven: consent },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      consentGiven: user.consentGiven,
    },
  });
});

/**
 * Upload profile photo (selfie)
 * @route POST /api/v1/user/profile-photo
 */
export const uploadProfilePhoto = catchAsync(async (req, res, next) => {
  // In a real implementation, this would handle file upload
  // For now, just updating a URL

  if (!req.body.photoUrl) {
    return next(new AppError("Photo URL is required", 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhoto: req.body.photoUrl },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: {
        profilePhoto: user.profilePhoto,
      },
    },
  });
});

/**
 * Delete user account
 * @route DELETE /api/v1/user/profile
 */
export const deleteUserAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
