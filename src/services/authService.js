// src/services/authService.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { promisify } from "util";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { emailService } from "./emailService.js";
import { hashToken, generateToken } from "../utils/tokenUtils.js";

class AuthService {
  /**
   * Generate JWT token
   * @param {string} id - User ID to include in the token
   * @returns {string} JWT token
   */
  signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Create and generate token response
   * @param {Object} user - User object
   * @returns {Object} Token response
   */
  createTokenResponse(user) {
    const token = this.signToken(user._id);

    // Calculate cookie expiry
    const cookieExpiryDate = new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    );

    // Cookie options
    const cookieOptions = {
      expires: cookieExpiryDate,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Remove password from output
    user.password = undefined;

    return {
      token,
      cookieOptions,
      user,
    };
  }

  /**
   * Login user with username and password
   * @param {string} userName - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Login response
   */
  async login(userName, password) {
    // Check if username and password exist
    if (!userName || !password) {
      throw new AppError("Please provide username and password", 400);
    }

    // Find user by username
    const user = await userRepository.findByUsername(userName, true);

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Incorrect username or password", 401);
    }

    // Return token response
    return this.createTokenResponse(user);
  }

  /**
   * Verify user authentication from token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User object
   */
  async verifyAuth(token) {
    if (!token) {
      throw new AppError("Please log in to access this resource", 401);
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new AppError("User belonging to this token no longer exists", 401);
    }

    return user;
  }

  /**
   * Send password reset email
   * @param {string} email - Email address
   * @returns {Promise<boolean>} Success indicator
   */
  async forgotPassword(email) {
    if (!email) {
      throw new AppError("Please provide your email address", 400);
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("No user found with that email address", 404);
    }

    // Generate random reset token
    const resetToken = generateToken();

    // Hash token and set to resetPasswordToken field
    const hashedToken = hashToken(resetToken);

    // Set token expiry time (10 minutes)
    const tokenExpiry = Date.now() + 10 * 60 * 1000;

    // Update user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = tokenExpiry;

    await userRepository.save(user, { validateBeforeSave: false });

    // Send email with reset token
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.userName
      );
      return true;
    } catch (err) {
      // If email fails, reset the token and expiry
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await userRepository.save(user, { validateBeforeSave: false });

      throw new AppError(
        "There was an error sending the email. Please try again later!",
        500
      );
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @param {string} passwordConfirm - Password confirmation
   * @returns {Promise<Object>} Login response
   */
  async resetPassword(token, password, passwordConfirm) {
    if (!password || !passwordConfirm) {
      throw new AppError(
        "Please provide password and password confirmation",
        400
      );
    }

    if (password !== passwordConfirm) {
      throw new AppError("Passwords do not match", 400);
    }

    // Hash the token to compare with the stored hashed token
    const hashedToken = hashToken(token);

    // Find user with the token and check if token has not expired
    const user = await userRepository.findByPasswordResetToken(
      hashedToken,
      Date.now()
    );

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    // Set the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await userRepository.save(user);

    // Return login response
    return this.createTokenResponse(user);
  }

  /**
   * Send email verification
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success indicator
   */
  async sendVerificationEmail(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.emailVerified) {
      throw new AppError("Email already verified", 400);
    }

    // Generate verification token
    const verificationToken = generateToken();

    // Hash token and save to user
    const hashedToken = hashToken(verificationToken);

    // Set token expiry (24 hours)
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = tokenExpiry;

    await userRepository.save(user, { validateBeforeSave: false });

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
      await userRepository.save(user, { validateBeforeSave: false });

      throw new AppError(
        "There was an error sending the verification email. Please try again later!",
        500
      );
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} Success indicator
   */
  async verifyEmail(token) {
    // Hash the token
    const hashedToken = hashToken(token);

    // Find user with matching token that hasn't expired
    const user = await userRepository.findByEmailVerificationToken(
      hashedToken,
      Date.now()
    );

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await userRepository.save(user);
    return true;
  }

  /**
   * Verify user identity against system records
   * @param {string} userId - User ID
   * @param {Object} verificationData - Verification data
   * @param {Function} verifyFunction - System verification function
   * @returns {Promise<Object>} Verification result
   */
  async verifyUserIdentity(userId, verificationData, verifyFunction) {
    const { idNumber, firstName, lastName, dateOfBirth } = verificationData;

    if (!idNumber || !firstName || !lastName || !dateOfBirth) {
      throw new AppError(
        "Please provide all required verification information",
        400
      );
    }

    // Verify against system
    const verificationResult = await verifyFunction(
      idNumber,
      firstName,
      lastName,
      dateOfBirth
    );

    if (!verificationResult.verified) {
      throw new AppError(
        `Verification failed: ${verificationResult.reason}`,
        400
      );
    }

    // Find and update user
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update user verification status
    user.isVerified = true;
    await userRepository.save(user);

    return {
      userName: user.userName,
      isVerified: user.isVerified,
    };
  }
}

export const authService = new AuthService();
