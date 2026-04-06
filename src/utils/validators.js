const mongoose = require('mongoose');
const ApiError = require('./ApiError');

/**
 * Centralized validation utilities.
 *
 * Keeping all validation logic here ensures:
 *  - Consistent error messages across the entire API
 *  - No duplicated validation code in controllers
 *  - Single place to update rules when requirements change
 */

/**
 * Validates whether a string is a valid MongoDB ObjectId.
 * Throws ApiError(400) upfront — prevents confusing CastError from Mongoose.
 *
 * @param {string} id    - value to validate
 * @param {string} field - human-readable field name for the error message
 */
const validateObjectId = (id, field = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
};

/**
 * Validates and sanitizes pagination query params.
 * Ensures `page` and `limit` are positive integers within safe bounds.
 *
 * @param {object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const validatePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validates and sanitizes a tags array.
 * Trims whitespace, lowercases, removes duplicates, filters empties.
 * Throws ApiError if the input is not an array or exceeds the max count.
 *
 * @param {any}      tags - raw value from request body
 * @returns {string[]}    - clean, deduplicated tags
 */
const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    throw new ApiError(400, 'tags must be an array of strings');
  }
  if (tags.length > 10) {
    throw new ApiError(400, 'Maximum of 10 tags per note');
  }

  return [
    ...new Set(
      tags
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
    ),
  ];
};

/**
 * Asserts that a required field is present and not empty.
 *
 * @param {any}    value     - field value from the request
 * @param {string} fieldName - human-readable name for the error message
 */
const requireField = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ApiError(400, `${fieldName} is required`);
  }
};

module.exports = { validateObjectId, validatePagination, validateTags, requireField };