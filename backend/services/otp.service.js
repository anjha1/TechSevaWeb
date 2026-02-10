/**
 * OTP Service
 * Handles OTP generation, storage, and validation
 */

// In-memory OTP store (consider using Redis for production with multiple instances)
const otpStore = new Map();

// OTP expiry time in milliseconds (5 minutes)
const OTP_EXPIRY = 5 * 60 * 1000;

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for a given email
 * @param {string} email - User email
 * @param {string} type - OTP type ('signup' or 'password_reset')
 * @returns {string} Generated OTP
 */
const storeOTP = (email, type = 'signup') => {
    const otp = generateOTP();
    otpStore.set(email, {
        otp,
        type,
        expiresAt: Date.now() + OTP_EXPIRY,
        createdAt: Date.now()
    });
    console.log(`[OTP SERVICE] Generated OTP for ${email} (type: ${type}): ${otp}`);
    return otp;
};

/**
 * Verify OTP for a given email
 * @param {string} email - User email
 * @param {string} otp - OTP to verify
 * @param {string} expectedType - Expected OTP type
 * @returns {Object} Verification result
 */
const verifyOTP = (email, otp, expectedType = 'signup') => {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
        return { 
            valid: false, 
            message: 'No OTP found for this email. Please request a new one.' 
        };
    }
    
    if (storedData.type !== expectedType) {
        return { 
            valid: false, 
            message: `Invalid OTP type. Expected ${expectedType}.` 
        };
    }
    
    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return { 
            valid: false, 
            message: 'OTP has expired. Please request a new one.' 
        };
    }
    
    if (storedData.otp !== otp) {
        return { 
            valid: false, 
            message: 'Invalid OTP. Please try again.' 
        };
    }
    
    // OTP is valid, consume it
    otpStore.delete(email);
    console.log(`[OTP SERVICE] OTP verified successfully for ${email}`);
    return { 
        valid: true, 
        message: 'OTP verified successfully.' 
    };
};

/**
 * Check if OTP exists for email (without consuming)
 * @param {string} email - User email
 * @param {string} type - Optional type filter
 * @returns {boolean} Whether valid OTP exists
 */
const hasValidOTP = (email, type = null) => {
    const storedData = otpStore.get(email);
    
    if (!storedData) return false;
    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return false;
    }
    if (type && storedData.type !== type) return false;
    
    return true;
};

/**
 * Clear OTP for email
 * @param {string} email - User email
 */
const clearOTP = (email) => {
    otpStore.delete(email);
};

/**
 * Get OTP data (for internal use)
 * @param {string} email - User email
 * @returns {Object|null} OTP data or null
 */
const getOTPData = (email) => {
    return otpStore.get(email) || null;
};

module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP,
    hasValidOTP,
    clearOTP,
    getOTPData
};
