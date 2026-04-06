/**
 * Custom application error class.
 *
 * Thrown anywhere in the app to signal a known, intentional error condition.
 * The global errorMiddleware catches these and converts them to the standard
 * { success: false, message, error: { code } } response shape.
 *
 * Usage:
 *   throw new ApiError(404, 'Note not found', 'NOT_FOUND');
 *   throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN');
 *   throw new ApiError(400, 'title: must be at least 2 characters', 'VALIDATION_ERROR');
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (400, 401, 403, 404, 409, 500…)
   * @param {string} message     - human-readable description shown to the client
   * @param {string} [code]      - machine-readable error code (defaults to 'API_ERROR')
   */
  constructor(statusCode, message, code = 'API_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.name       = 'ApiError';
  }
}

module.exports = ApiError;