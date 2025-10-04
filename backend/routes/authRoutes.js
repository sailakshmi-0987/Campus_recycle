const express = require('express');
const router = express.Router();
const {
    register,
    verifyEmail,
    login,
    getMe,
    resendVerification,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    validateUserRegistration,
    validateUserLogin
} = require('../middleware/validation');

router.post('/register', authLimiter, validateUserRegistration, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/login', authLimiter, validateUserLogin, login);
router.get('/me', protect, getMe);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/logout', protect, logout);

module.exports = router;