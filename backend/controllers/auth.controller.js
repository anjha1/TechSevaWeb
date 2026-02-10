/**
 * Authentication Controller
 * Handles all auth-related operations: login, register, OTP, password reset
 */

const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { User } = require('../models');
const { sendOTPEmail, storeOTP, verifyOTP: verifyOTPService } = require('../services');
const { response, logger } = require('../utils');
const config = require('../config/env');

// Initialize Google OAuth client
let googleAuthClient;
if (config.google.clientId) {
    googleAuthClient = new OAuth2Client(config.google.clientId);
}

// Helper to check admin roles
const isAnAdminRole = (role) => User.isAdminRole(role);

// Get redirect URL based on role
const getRedirectUrl = (role) => {
    const routes = {
        'user': '/user-dashboard',
        'technician': '/technician-dashboard',
        'Superadmin': '/superadmin-dashboard',
        'Citymanager': '/citymanager-dashboard',
        'Serviceadmin': '/serviceadmin-dashboard',
        'Financeofficer': '/financeofficer-dashboard',
        'Supportagent': '/supportagent-dashboard'
    };
    return routes[role] || '/';
};

/**
 * Send OTP for signup or password reset
 */
const sendOTP = async (req, res) => {
    logger.info('AUTH', 'Send OTP request', { email: req.body.email });
    try {
        const { email, type = 'signup' } = req.body;
        
        if (!email) {
            return response.badRequest(res, 'Email is required to send OTP.');
        }

        const user = await User.findOne({ email });

        if (type === 'signup') {
            if (user && user.isVerified) {
                return response.conflict(res, 'User with this email already exists. Please login.');
            }
        } else if (type === 'password_reset') {
            if (!user) {
                // Return success to prevent email enumeration
                return response.success(res, 'If this email is registered, a password reset OTP has been sent.');
            }
            if (!user.password && user.googleId) {
                return response.badRequest(res, 'This account is registered via Google. Password reset is not applicable.');
            }
        }

        const otp = storeOTP(email, type);
        const subject = type === 'signup' 
            ? 'Your TechSeva OTP for Registration' 
            : 'Your TechSeva Password Reset OTP';

        const sent = await sendOTPEmail(email, otp, subject);
        
        if (sent) {
            return response.success(res, `OTP sent to ${email}. Please check your email.`);
        }
        
        return response.serverError(res, 'Failed to send OTP email. Please try again.');
    } catch (err) {
        logger.error('AUTH', 'Send OTP error', err);
        return response.serverError(res, 'Internal server error during OTP sending.');
    }
};

/**
 * Verify OTP for signup
 */
const verifyOTP = (req, res) => {
    logger.info('AUTH', 'Verify OTP request', { email: req.body.email });
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return response.badRequest(res, 'Email and OTP are required.');
        }
        
        const result = verifyOTPService(email, otp, 'signup');
        
        if (!result.valid) {
            return response.badRequest(res, result.message);
        }
        
        return response.success(res, 'OTP verified successfully.');
    } catch (err) {
        logger.error('AUTH', 'Verify OTP error', err);
        return response.serverError(res, 'Internal server error during OTP verification.');
    }
};

/**
 * User Registration
 */
const register = async (req, res) => {
    logger.info('AUTH', 'Register request', { email: req.body.email, role: req.body.role });
    try {
        const { fullName, email, password, role, aadhaar, pan, skills } = req.body;
        const phoneNumber = req.body.phoneNumber?.trim() || undefined;

        if (!fullName || !email || !password || !role) {
            return response.badRequest(res, 'All required fields must be provided.');
        }

        // Prevent admin registration via this route
        if (isAnAdminRole(role)) {
            return response.forbidden(res, 'Admin accounts cannot be created via user registration.');
        }

        // Check existing user
        let existingUser = await User.findOne({ email });
        
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Update unverified user
                existingUser.fullName = fullName;
                existingUser.phoneNumber = phoneNumber;
                existingUser.password = password;
                existingUser.role = role;
                existingUser.isVerified = true;
                
                if (role === 'technician') {
                    existingUser.aadhaar = aadhaar;
                    existingUser.pan = pan;
                    existingUser.skills = skills?.split(',').map(s => s.trim()) || [];
                    existingUser.kycStatus = 'pending';
                }
                
                await existingUser.save();
                
                req.session.user = {
                    id: existingUser._id.toString(),
                    fullName: existingUser.fullName,
                    email: existingUser.email,
                    role: existingUser.role,
                    kycStatus: existingUser.kycStatus
                };
                
                return response.success(res, 'Account updated and verified.', {
                    redirect: getRedirectUrl(existingUser.role),
                    user: req.session.user
                });
            }
            return response.conflict(res, 'User with this email already exists. Please login.');
        }

        // Check phone number uniqueness
        if (phoneNumber) {
            const existingPhone = await User.findOne({ phoneNumber });
            if (existingPhone) {
                return response.conflict(res, 'User with this phone number already exists.');
            }
        }

        // Create new user
        const newUser = new User({
            fullName,
            email,
            phoneNumber,
            password,
            role,
            isVerified: true
        });

        if (role === 'technician') {
            if (!aadhaar || !pan || !skills) {
                return response.badRequest(res, 'Technician registration requires Aadhaar, PAN, and Skills.');
            }
            newUser.aadhaar = aadhaar;
            newUser.pan = pan;
            newUser.skills = skills.split(',').map(s => s.trim());
            newUser.kycStatus = 'pending';
            newUser.balance = 0;
        } else {
            newUser.kycStatus = 'approved';
        }

        await newUser.save();

        req.session.user = {
            id: newUser._id.toString(),
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            kycStatus: newUser.kycStatus
        };

        logger.info('AUTH', 'User registered successfully', { userId: newUser._id, role: newUser.role });

        return response.success(res, `Registration successful for ${role}. You are now logged in.`, {
            redirect: getRedirectUrl(newUser.role),
            user: req.session.user
        });

    } catch (err) {
        logger.error('AUTH', 'Register error', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return response.conflict(res, `A user with this ${field} already exists.`);
        }
        return response.serverError(res, 'Internal server error during registration.');
    }
};

/**
 * User Login
 */
const login = async (req, res) => {
    logger.info('AUTH', 'Login request', { email: req.body.email });
    try {
        const { email, password, role: selectedRole } = req.body;

        if (!email || !password || !selectedRole) {
            return response.badRequest(res, 'Email, password, and role are required.');
        }

        const user = await User.findOne({ email });

        if (!user) {
            return response.unauthorized(res, 'Invalid email or password.');
        }

        if (user.role !== selectedRole) {
            return response.forbidden(res, `You are registered as a ${user.role}. Please select the correct role.`);
        }

        if (!user.password && user.googleId) {
            return response.unauthorized(res, 'This account is registered via Google. Please use Google Sign-in.');
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return response.unauthorized(res, 'Invalid email or password.');
        }

        if (user.role === 'technician' && user.kycStatus !== 'approved') {
            const message = user.kycStatus === 'pending'
                ? 'Your technician application is pending. Please wait for approval.'
                : 'Your technician application was rejected. Please contact support.';
            return response.forbidden(res, message);
        }

        req.session.user = {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus
        };

        logger.info('AUTH', 'User logged in', { userId: user._id, role: user.role });

        return response.success(res, 'Login successful', {
            data: { 
                redirect: getRedirectUrl(user.role),
                user: req.session.user
            }
        });

    } catch (err) {
        logger.error('AUTH', 'Login error', err);
        return response.serverError(res, 'Internal server error during login.');
    }
};

/**
 * Google Login
 */
const googleLogin = async (req, res) => {
    logger.info('AUTH', 'Google login request received');
    const { idToken } = req.body;

    if (!idToken) {
        logger.warn('AUTH', 'Google login - No ID token provided');
        return response.badRequest(res, 'Google ID token is required.');
    }

    if (!googleAuthClient) {
        logger.error('AUTH', 'Google OAuth client not configured. GOOGLE_CLIENT_ID:', config.google.clientId);
        return response.serverError(res, 'Google OAuth not configured.');
    }

    try {
        logger.info('AUTH', 'Verifying Google ID token with client ID:', config.google.clientId);
        const ticket = await googleAuthClient.verifyIdToken({
            idToken,
            audience: config.google.clientId,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name: fullName, email_verified } = payload;
        logger.info('AUTH', 'Google token verified for:', email);

        if (!email_verified) {
            return response.badRequest(res, 'Google account email not verified.');
        }

        let user = await User.findOne({ $or: [{ googleId }, { email }] });
        
        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }

            if (user.role === 'technician' && user.kycStatus !== 'approved') {
                const message = user.kycStatus === 'pending'
                    ? 'Your technician application is pending.'
                    : 'Your technician application was rejected.';
                return response.forbidden(res, message);
            }

            req.session.user = {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                kycStatus: user.kycStatus,
                phoneNumber: user.phoneNumber
            };

            if (!user.phoneNumber) {
                return response.success(res, 'Please provide a phone number to continue.', { 
                    data: { needsPhoneUpdate: true, user: req.session.user }
                });
            }

            return response.success(res, 'Logged in with Google successfully!', {
                data: { user: req.session.user, redirect: getRedirectUrl(user.role) }
            });

        } else {
            // Create new user
            const newUser = new User({
                fullName: fullName || 'Google User',
                email,
                googleId,
                role: 'user',
                isVerified: true,
                kycStatus: 'approved'
            });
            await newUser.save();

            req.session.user = {
                id: newUser._id.toString(),
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                kycStatus: newUser.kycStatus
            };

            return response.success(res, 'Please add your phone number to complete your profile.', { 
                data: { needsPhoneUpdate: true, user: req.session.user }
            });
        }

    } catch (error) {
        logger.error('AUTH', 'Google login error:', error.message);
        console.error('Full Google login error:', error);
        return response.unauthorized(res, `Google Sign-in failed: ${error.message}`);
    }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
    logger.info('AUTH', 'Reset password request', { email: req.body.email });
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return response.badRequest(res, 'All fields are required.');
    }

    if (newPassword.length < 8) {
        return response.badRequest(res, 'Password must be at least 8 characters.');
    }

    const result = verifyOTPService(email, otp, 'password_reset');
    if (!result.valid) {
        return response.badRequest(res, result.message);
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return response.notFound(res, 'User not found.');
        }

        if (!user.password && user.googleId) {
            return response.badRequest(res, 'This account is registered via Google.');
        }

        user.password = newPassword;
        await user.save();

        logger.info('AUTH', 'Password reset successful', { email });
        return response.success(res, 'Password reset successfully. You can now login.');

    } catch (error) {
        logger.error('AUTH', 'Reset password error', error);
        return response.serverError(res, 'Internal server error during password reset.');
    }
};

/**
 * Logout
 */
const logout = (req, res) => {
    logger.info('AUTH', 'Logout request');
    req.session.destroy(err => {
        if (err) {
            logger.error('AUTH', 'Logout error', err);
            return response.serverError(res, 'Could not log out. Please try again.');
        }
        res.clearCookie('connect.sid');
        return response.success(res, 'Logged out successfully.', { redirect: '/' });
    });
};

module.exports = {
    sendOTP,
    verifyOTP,
    register,
    login,
    googleLogin,
    resetPassword,
    logout,
    getRedirectUrl
};
