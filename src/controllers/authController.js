// src/controllers/authController.js
import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError.js";
import { promisify } from "util";

/**
 * Generate JWT token
 * @param {string} id - User ID to include in the token
 * @returns {string} JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Create and send JWT token
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Set secure cookies in production
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

/**
 * Login user and send JWT token
 */
export const login = catchAsync(async (req, res, next) => {
  const { userName, password } = req.body;

  // Check if username and password exist
  if (!userName || !password) {
    return next(new AppError("Please provide username and password", 400));
  }

  // Find user by username
  const user = await User.findOne({ userName }).select("+password");

  // Check if user exists and password is correct
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect username or password", 401));
  }

  // Send token
  createSendToken(user, 200, res);
});

/**
 * Get current user info
 */
export const currentUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

/**
 * Logout user
 */
export const logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    message: "Successfully logged out",
  });
});

/**
 * Verify user ID
 */
export const verifyUser = catchAsync(async (req, res, next) => {
  const { idNumber, firstName, lastName, dateOfBirth } = req.body;

  if (!idNumber || !firstName || !lastName || !dateOfBirth) {
    return next(
      new AppError("Please provide all required verification information", 400)
    );
  }

  // Get the verification helper from system controller
  const { verifyIdAgainstDummy } = await import("./systemController.js");

  // Verify against dummy database
  const verificationResult = await verifyIdAgainstDummy(
    idNumber,
    firstName,
    lastName,
    dateOfBirth
  );

  if (!verificationResult.verified) {
    return next(
      new AppError(`Verification failed: ${verificationResult.reason}`, 400)
    );
  }

  // Find and update user
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Update user verification status
  user.isVerified = true;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "User successfully verified",
    data: {
      user: {
        userName: user.userName,
        isVerified: user.isVerified,
      },
    },
  });
});

/**
 * Protect routes - Authentication middleware
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("Please log in to access this resource", 401));
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new AppError("User belonging to this token no longer exists", 401)
    );
  }

  // Grant access to protected route
  req.user = user;
  next();
});

/**
 * Restrict access to specific roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

/**
 * Send password reset email
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  // Implementation would include:
  // 1. Find user by email
  // 2. Generate reset token
  // 3. Send email with reset link

  res.status(200).json({
    status: "success",
    message: "Password reset email sent",
  });
});
