/**
 * Environment Configuration
 * Centralizes all environment variables with validation and defaults
 */

require('dotenv').config();

const config = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // MongoDB
    mongodbUri: process.env.MONGODB_URI,
    
    // Session
    sessionSecret: process.env.SESSION_SECRET || 'supersecretkeyforprod',
    
    // Email (Nodemailer)
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    
    // Google APIs
    google: {
        mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY,
        clientId: process.env.GOOGLE_CLIENT_ID,
    },
    
    // AI/ML
    geminiApiKey: process.env.API_KEY,
    
    // Business Constants
    appCommissionRate: 0.10, // 10%
    taxRateIndia: 0.18, // 18% GST
    
    // Frontend URL (for CORS)
    frontendUrl: process.env.FRONTEND_URL || '*',
};

// Validation for critical environment variables
const validateConfig = () => {
    const requiredVars = [
        { key: 'mongodbUri', name: 'MONGODB_URI' },
    ];
    
    const missing = requiredVars.filter(v => !config[v.key]);
    
    if (missing.length > 0) {
        console.error('❌ CRITICAL ERROR: Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v.name}`));
        console.error('Please set these in your .env file or environment.');
        process.exit(1);
    }
    
    // Warnings for optional but recommended variables
    const recommended = [
        { key: 'email.user', path: ['email', 'user'], name: 'EMAIL_USER' },
        { key: 'email.pass', path: ['email', 'pass'], name: 'EMAIL_PASS' },
        { key: 'google.clientId', path: ['google', 'clientId'], name: 'GOOGLE_CLIENT_ID' },
        { key: 'google.mapsApiKey', path: ['google', 'mapsApiKey'], name: 'VITE_GOOGLE_MAPS_API_KEY' },
    ];
    
    recommended.forEach(v => {
        const value = v.path.reduce((obj, key) => obj?.[key], config);
        if (!value) {
            console.warn(`⚠️  Warning: ${v.name} not set. Related features may not work.`);
        }
    });
};

// Run validation
validateConfig();

module.exports = config;
