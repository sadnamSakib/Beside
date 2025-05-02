// src/utils/catchAsync.js
/**
 * Wrapper function to catch async errors
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Middleware function with error handling
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
