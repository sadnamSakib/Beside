// src/controllers/authController.js
import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError.js";
import { promisify } from "util";
import crypto from "crypto";
import { emailService } from "../services/emailService.js";
import { hashToken } from "../utils/tokenUtils.js";

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
  // 1) Get user based on POST email
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide your email address", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("No user found with that email address", 404));
  }

  // 2) Generate random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiry time (10 minutes)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // 3) Send email with reset token
  try {
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.userName
    );

    res.status(200).json({
      status: "success",
      message: "Password reset token sent to your email",
    });
  } catch (err) {
    // If email fails, reset the token and expiry
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Please try again later!",
        500
      )
    );
  }
});

/**
 * Reset password with token
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(
      new AppError("Please provide password and password confirmation", 400)
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match", 400));
  }

  // Hash the token to compare with the stored hashed token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the token and check if token has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 2) Set the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

/**
 * Send email verification
 */
export const sendVerificationEmail = catchAsync(async (req, res, next) => {
  // This could be used when a user requests a new verification email
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.emailVerified) {
    return next(new AppError("Email already verified", 400));
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to user
  user.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.userName
    );

    res.status(200).json({
      status: "success",
      message: "Verification email sent",
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the verification email. Please try again later!",
        500
      )
    );
  }
});

/**
 * Verify email with token
 */
export const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Hash the token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  // Return success
  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

/**
 * Send verification email on registration
 * This should be called after a new user is created
 */
export const sendInitialVerificationEmail = async (user) => {
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to user
  user.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.userName
    );

    return true;
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return false;
  }
};
