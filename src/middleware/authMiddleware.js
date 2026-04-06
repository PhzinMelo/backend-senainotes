const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * JWT authentication middleware.
 *
 * Flow:
 *  1. Extracts the token from the Authorization header (Bearer <token>)
 *  2. Verifies and decodes it using the secret key
 *  3. Injects { id, email } into req.user
 *  4. Calls next() to hand off to the controller
 *
 * Fix applied:
 *  - was injecting req.usuario (PT) — renamed to req.user (EN)
 */
const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token not provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired — please log in again');
    }
    throw new ApiError(401, 'Invalid token');
  }
};

module.exports = authMiddleware;