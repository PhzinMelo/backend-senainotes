const ApiError = require('../utils/ApiError');

/**
 * Global error handling middleware.
 * Must be the LAST middleware registered in app.js.
 *
 * Every error response follows the same shape:
 * {
 *   "success": false,
 *   "message": "Human-readable description",
 *   "error": {
 *     "code": "MACHINE_READABLE_CODE",
 *     "details": "..." // dev only
 *   }
 * }
 *
 * Handled error types:
 *  - ApiError          → intentional app errors with known status + code
 *  - ValidationError   → Mongoose schema validation failures
 *  - CastError         → invalid MongoDB ObjectId format
 *  - Duplicate key     → unique constraint violation (code 11000)
 *  - Generic errors    → 500, no internals leaked in production
 */
const errorMiddleware = (err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log in development — silent errors are the worst to debug
  if (isDev) {
    console.error('🔴 ERROR:', err);
  }

  // ── Helper: build the standard error body ─────────────────────────────────
  const respond = (statusCode, message, code, details = null) => {
    const error = { code };
    if (isDev && details) error.details = details;
    return res.status(statusCode).json({ success: false, message, error });
  };

  // ── Intentional application error (ApiError) ──────────────────────────────
  if (err instanceof ApiError) {
    return respond(err.statusCode, err.message, err.code || 'API_ERROR');
  }

  // ── Mongoose schema validation (required, minlength, etc.) ────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join('; ');
    return respond(400, messages, 'VALIDATION_ERROR');
  }

  // ── Invalid MongoDB ObjectId ──────────────────────────────────────────────
  if (err.name === 'CastError') {
    return respond(400, `Invalid value for field: ${err.path}`, 'INVALID_ID');
  }

  // ── Unique field constraint (e.g. duplicate email) ────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return respond(409, `${field} is already in use`, 'DUPLICATE_FIELD');
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return respond(401, 'Invalid token', 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return respond(401, 'Token expired — please log in again', 'TOKEN_EXPIRED');
  }

  // ── Fallback 500 — never leak internals in production ─────────────────────
  return respond(
    500,
    'Internal server error',
    'INTERNAL_ERROR',
    isDev ? err.message : null
  );
};

module.exports = errorMiddleware;