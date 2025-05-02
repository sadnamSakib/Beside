// src/services/userService.js
import { userRepository } from "../repositories/userRepository.js";
import { passwordHash } from "../utils/passwordHash.js";
import { AppError } from "../utils/AppError.js";

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Newly created user
   */
  async createUser(userData) {
    const { userName, email, mobileNo, password, role } = userData;

    // Check if user already exists
    const userExists = await userRepository.findByUsernameOrEmail(
      userName,
      email
    );

    if (userExists) {
      throw new AppError(
        "User with this email or username already exists",
        400
      );
    }

    // Hash password
    const hashedPassword = await passwordHash(password);

    // Create user
    const user = await userRepository.create({
      userName,
      email,
      password: hashedPassword,
      mobileNo,
      role: role || "User",
    });

    return user;
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Get user by username
   * @param {string} userName - Username
   * @param {boolean} includePassword - Whether to include password
   * @returns {Promise<Object>} User object
   */
  async getUserByUsername(userName, includePassword = false) {
    const user = await userRepository.findByUsername(userName, includePassword);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Get user by email
   * @param {string} email - Email
   * @returns {Promise<Object>} User object
   */
  async getUserByEmail(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUserProfile(userId, updateData) {
    const { profileSettings, mobileNo, profilePhoto } = updateData;

    // Fields allowed to update
    const filteredBody = {};

    if (profileSettings) {
      filteredBody.profileSettings = profileSettings;
    }

    // Add other allowed fields
    if (mobileNo) filteredBody.mobileNo = mobileNo;
    if (profilePhoto) filteredBody.profilePhoto = profilePhoto;

    // Update lastUpdated timestamp
    filteredBody.lastUpdated = Date.now();

    const updatedUser = await userRepository.update(userId, filteredBody);

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return updatedUser;
  }

  /**
   * Update user consent settings
   * @param {string} userId - User ID
   * @param {boolean} consent - Consent value
   * @returns {Promise<Object>} Updated user
   */
  async updateConsent(userId, consent) {
    if (consent === undefined) {
      throw new AppError("Consent value is required", 400);
    }

    const user = await userRepository.update(userId, { consentGiven: consent });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Update profile photo
   * @param {string} userId - User ID
   * @param {string} photoUrl - Profile photo URL
   * @returns {Promise<Object>} Updated user
   */
  async updateProfilePhoto(userId, photoUrl) {
    if (!photoUrl) {
      throw new AppError("Photo URL is required", 400);
    }

    const user = await userRepository.update(userId, {
      profilePhoto: photoUrl,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUserAccount(userId) {
    const result = await userRepository.delete(userId);

    if (!result) {
      throw new AppError("User not found", 404);
    }
  }
}

export const userService = new UserService();
