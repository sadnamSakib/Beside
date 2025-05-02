// src/repositories/userRepository.js
import { User } from "../models/userModel.js";

export class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Newly created user
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} User object
   */
  async findById(id) {
    return await User.findById(id);
  }

  /**
   * Find a user by username
   * @param {string} userName - Username
   * @param {boolean} includePassword - Whether to include password field
   * @returns {Promise<Object>} User object
   */
  async findByUsername(userName, includePassword = false) {
    if (includePassword) {
      return await User.findOne({ userName }).select("+password");
    }
    return await User.findOne({ userName });
  }

  /**
   * Find a user by email
   * @param {string} email - Email
   * @returns {Promise<Object>} User object
   */
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  /**
   * Find user by username or email
   * @param {string} userName - Username
   * @param {string} email - Email
   * @returns {Promise<Object>} User object
   */
  async findByUsernameOrEmail(userName, email) {
    return await User.findOne({
      $or: [{ email }, { userName }],
    });
  }

  /**
   * Find user by password reset token
   * @param {string} hashedToken - Hashed reset token
   * @param {Date} expiryDate - Token expiry
   * @returns {Promise<Object>} User object
   */
  async findByPasswordResetToken(hashedToken, expiryDate) {
    return await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: expiryDate },
    });
  }

  /**
   * Find user by email verification token
   * @param {string} hashedToken - Hashed verification token
   * @param {Date} expiryDate - Token expiry
   * @returns {Promise<Object>} User object
   */
  async findByEmailVerificationToken(hashedToken, expiryDate) {
    return await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: expiryDate },
    });
  }

  /**
   * Update a user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updateData, options = { new: true, runValidators: true }) {
    return await User.findByIdAndUpdate(id, updateData, options);
  }

  /**
   * Save a user
   * @param {Object} user - User object to save
   * @param {Object} options - Save options
   * @returns {Promise<Object>} Saved user
   */
  async save(user, options = {}) {
    return await user.save(options);
  }

  /**
   * Delete a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async delete(id) {
    return await User.findByIdAndDelete(id);
  }
}

export const userRepository = new UserRepository();
