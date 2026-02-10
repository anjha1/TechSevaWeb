/**
 * Authentication Routes
 * Handles login, register, OTP, password reset
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { isAuthenticated } = require('../middlewares');

// Public routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', isAuthenticated, authController.logout);

module.exports = router;
