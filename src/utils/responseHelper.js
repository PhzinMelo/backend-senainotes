/**
 * Standardized API response helpers.
 *
 * Every response in the API uses one of these two shapes:
 *
 * SUCCESS:
 * {
 *   "success": true,
 *   "message": "Human-readable description",
 *   "data": <array | object | null>,
 *   "pagination": <object>  ← only on list endpoints
 * }
 *
 * ERROR:
 * {
 *   "success": false,
 *   "message": "Human-readable error description",
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "details": "..."      ← dev mode only
 *   }
 * }
 *
 * Why "success" instead of "error":
 *  - Positive boolean is easier to read: if (response.success) vs if (!response.error)
 *  - Matches the convention used by most modern REST APIs
 *  - Avoids confusion when checking truthiness
 */

/**
 * Sends a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {number}  statusCode  - HTTP status (200, 201, etc.)
 * @param {string}  message     - human-readable description
 * @param {any}     [data]      - response payload (array or object)
 * @param {object}  [pagination] - optional pagination metadata for list endpoints
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const body = { success: true, message };

  // Always include data field (null when there's nothing to return, e.g. DELETE)
  body.data = data;

  // Include pagination only when explicitly provided (list endpoints)
  if (pagination !== null) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
};

/**
 * Sends an error JSON response.
 * Prefer throwing ApiError and letting errorMiddleware handle it.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode - HTTP status (400, 401, 404, 500, etc.)
 * @param {string} message    - human-readable error description
 * @param {string} [code]     - machine-readable error code (e.g. 'NOT_FOUND')
 * @param {string} [details]  - extra context (only in dev mode)
 */
const errorResponse = (res, statusCode = 500, message = 'Internal server error', code = 'INTERNAL_ERROR', details = null) => {
  const error = { code };
  if (details && process.env.NODE_ENV !== 'production') error.details = details;

  return res.status(statusCode).json({ success: false, message, error });
};

module.exports = { successResponse, errorResponse };