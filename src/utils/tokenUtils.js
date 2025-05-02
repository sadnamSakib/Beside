// src/utils/tokenUtils.js
import crypto from "crypto";

/**
 * Generate a random token
 * @returns {string} Random token
 */
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token with SHA-256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
