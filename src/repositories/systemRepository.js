// src/repositories/systemRepository.js
import mongoose from "mongoose";

// Define the schema for dummy verification data
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

export class SystemRepository {
  /**
   * Create dummy verification data
   * @param {Object|Array} data - Single verification record or array of records
   * @returns {Promise<Object>} Created verification data
   */
  async createDummyData(data) {
    if (Array.isArray(data)) {
      return await DummyVerification.insertMany(data);
    }
    return await DummyVerification.create(data);
  }

  /**
   * Get all dummy verification data
   * @returns {Promise<Array>} Array of verification records
   */
  async getAllDummyData() {
    return await DummyVerification.find();
  }

  /**
   * Find verification data by ID number
   * @param {string} idNumber - ID number to search for
   * @returns {Promise<Object>} Verification record
   */
  async findDummyDataByIdNumber(idNumber) {
    return await DummyVerification.findOne({ idNumber });
  }

  /**
   * Update verification data
   * @param {string} idNumber - ID number to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated verification record
   */
  async updateDummyData(idNumber, updateData) {
    return await DummyVerification.findOneAndUpdate({ idNumber }, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete verification data
   * @param {string} idNumber - ID number to delete
   * @returns {Promise<Object>} Deleted verification record
   */
  async deleteDummyData(idNumber) {
    return await DummyVerification.findOneAndDelete({ idNumber });
  }
}

export const systemRepository = new SystemRepository();
