// src/controllers/userController.js
import { userService } from "../services/userService.js";
import { authService } from "../services/authService.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

/**
 * Register a new user
 * @route POST /api/v1/user/register
 */
export const registerUser = catchAsync(async (req, res, next) => {
  const { userName, email, mobileNo, password, role } = req.body;

  // Create user with service
  const user = await userService.createUser({
    userName,
    email,
    mobileNo,
    password,
    role,
  });

  // Send verification email
  try {
    await authService.sendVerificationEmail(user._id);
  } catch (error) {
    // Continue even if email sending fails
    console.error("Failed to send verification email:", error);
  }

  // Generate token and send response
  const tokenResponse = authService.createTokenResponse(user);

  // Set cookie
  res.cookie("jwt", tokenResponse.token, tokenResponse.cookieOptions);

  // Send response
  res.status(201).json({
    status: "success",
    token: tokenResponse.token,
    data: {
      user: tokenResponse.user,
    },
  });
});

/**
 * Get user profile
 * @route GET /api/v1/user/profile
 */
export const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user._id);

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

  // Update user profile
  const updatedUser = await userService.updateUserProfile(req.user._id, {
    profileSettings,
    mobileNo: req.body.mobileNo,
    profilePhoto: req.body.profilePhoto,
  });

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

  const user = await userService.updateConsent(req.user._id, consent);

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
  const user = await userService.updateProfilePhoto(
    req.user._id,
    req.body.photoUrl
  );

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
  await userService.deleteUserAccount(req.user._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
