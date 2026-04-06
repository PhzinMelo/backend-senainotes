const authService = require('../services/authService');
const ApiError    = require('../utils/ApiError');
const { successResponse } = require('../utils/responseHelper');
const { registerSchema, loginSchema, formatZodErrors } = require('../utils/schemas');

/**
 * Auth controller.
 *
 * Response shapes:
 *  REGISTER: { success: true, data: { user: { id, name, email }, token } }
 *  LOGIN:    { success: true, data: { user: { id, name, email }, token } }
 *  ERROR:    { success: false, message, error: { code } }
 */

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, formatZodErrors(result.error), 'VALIDATION_ERROR');
  }

  const { name, email, password } = result.data;
  const { user, token } = await authService.register({ name, email, password });

  return successResponse(res, 201, 'User registered successfully', {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(400, formatZodErrors(result.error), 'VALIDATION_ERROR');
  }

  const { email, password } = result.data;
  const { user, token } = await authService.login({ email, password });

  return successResponse(res, 200, 'Login successful', {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
};

module.exports = { register, login };