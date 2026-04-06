const { Router } = require('express');
const authController = require('../controllers/authController');

const router = Router();

/**
 * Public authentication routes (no JWT required).
 *
 * POST /api/auth/register  → Create a new user account
 *                            Body: { name, email, password }
 *
 * POST /api/auth/login     → Authenticate and receive a JWT
 *                            Body: { email, password }
 */
router.post('/register', authController.register);
router.post('/login',    authController.login);

module.exports = router;