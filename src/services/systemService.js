// src/services/systemService.js
import { systemRepository } from "../repositories/systemRepository.js";
import { AppError } from "../utils/AppError.js";

class SystemService {
  /**
   * Create dummy verification data
   * @param {Object|Array} verificationData - Verification data
   * @returns {Promise<Object>} Created data
   */
  async createDummyData(verificationData) {
    if (!Array.isArray(verificationData) && !verificationData.idNumber) {
      throw new AppError("Please provide valid verification data", 400);
    }

    return await systemRepository.createDummyData(verificationData);
  }

  /**
   * Append to existing dummy data
   * @param {Array} verificationData - Array of verification data
   * @returns {Promise<Array>} Created data
   */
  async appendDummyData(verificationData) {
    if (!Array.isArray(verificationData)) {
      throw new AppError("Please provide an array of verification data", 400);
    }

    return await systemRepository.createDummyData(verificationData);
  }

  /**
   * Update existing dummy data
   * @param {string} idNumber - ID number to update
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated data
   */
  async updateDummyData(idNumber, updateData) {
    if (!idNumber) {
      throw new AppError("Please provide an ID number", 400);
    }

    const result = await systemRepository.updateDummyData(idNumber, updateData);

    if (!result) {
      throw new AppError("No dummy data found with that ID", 404);
    }

    return result;
  }

  /**
   * Delete dummy data
   * @param {string} idNumber - ID number to delete
   * @returns {Promise<Object>} Deleted data
   */
  async deleteDummyData(idNumber) {
    if (!idNumber) {
      throw new AppError("Please provide an ID number", 400);
    }

    const result = await systemRepository.deleteDummyData(idNumber);

    if (!result) {
      throw new AppError("No dummy data found with that ID", 404);
    }

    return result;
  }

  /**
   * Get all dummy verification data
   * @returns {Promise<Array>} All verification data
   */
  async getAllDummyData() {
    return await systemRepository.getAllDummyData();
  }

  /**
   * Verify ID against dummy database
   * @param {string} idNumber - ID number
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {Date} dateOfBirth - Date of birth
   * @returns {Promise<Object>} Verification result
   */
  async verifyIdAgainstDummy(idNumber, firstName, lastName, dateOfBirth) {
    // Find the record in our dummy database
    const record = await systemRepository.findDummyDataByIdNumber(idNumber);

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
  }

  /**
   * Check if in development environment
   * @returns {boolean} Is in development
   */
  isDevEnvironment() {
    return process.env.NODE_ENV === "development";
  }
}

export const systemService = new SystemService();
