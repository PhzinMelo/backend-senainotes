const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Auth service — business logic for registration and login.
 *
 * Fixes applied (previously broken):
 *  - generateToken: was named gerarToken (PT) — renamed to EN
 *  - register: was passing { nome, email, senha } to User.create()
 *    but User model fields are { name, email, password } → ValidationError every time
 *  - login: was doing .select('+senha') but the model field is 'password'
 *    → password was always undefined → comparePassword always returned false
 */

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Signs a JWT for the authenticated user.
 * Payload contains only { id, email } — minimal surface area.
 *
 * @param {object} user - User model instance
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── Public operations ────────────────────────────────────────────────────────

/**
 * Registers a new user.
 * - Explicitly checks for duplicate email before insert (clearer error message)
 * - Password hashing is handled automatically by the User model pre-save hook
 *
 * @param {{ name, email, password }} data
 * @returns {{ user, token }}
 */
const register = async ({ name, email, password }) => {
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, 'Email already in use');
  }

  // BUG FIX: was { nome, email, senha } — User model requires { name, email, password }
  const user = await User.create({ name, email, password });
  const token = generateToken(user);

  return { user, token };
};

/**
 * Authenticates a user with email and password.
 * - Fetches the user including the password field (hidden by select:false in schema)
 * - Compares password via bcrypt (safe against timing attacks)
 * - Returns a generic error to avoid revealing whether the email exists
 *
 * @param {{ email, password }} credentials
 * @returns {{ user, token }}
 */
const login = async ({ email, password }) => {
  // BUG FIX: was .select('+senha') — correct field name is 'password'
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user);
  return { user, token };
};

module.exports = { register, login };