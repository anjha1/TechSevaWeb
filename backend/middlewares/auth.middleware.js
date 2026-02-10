/**
 * Authentication Middleware
 * Handles session validation and user authentication
 */

const User = require('../models/User.model');

/**
 * Check if user is authenticated via session
 */
const isAuthenticated = (req, res, next) => {
    if (req.session.user && req.session.user.id) {
        return next();
    }
    
    if (req.accepts('html')) {
        console.log(`Unauthenticated HTML request for ${req.path}, redirecting to /`);
        return res.redirect('/');
    }
    
    console.log(`Unauthenticated API request for ${req.path}, sending 401 JSON response.`);
    res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login.', 
        redirect: '/' 
    });
};

/**
 * Alias for isAuthenticated - authenticateToken
 */
const authenticateToken = isAuthenticated;

/**
 * Load user details from database into req.user
 * Should be applied globally after session middleware
 */
const loadUser = async (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
        try {
            req.user = await User.findById(req.session.user.id).select('-password').lean();
            
            if (!req.user) {
                req.session.destroy(err => {
                    if (err) console.error('Session destruction error on user not found:', err);
                    return res.status(401).json({ 
                        success: false, 
                        message: 'User data not found. Session cleared. Please log in again.', 
                        redirect: '/' 
                    });
                });
                return;
            }
            
            if (!req.user.role) {
                console.warn(`[LOAD USER] User ${req.user._id} found, but role is missing. Defaulting to 'user'.`);
                req.user.role = 'user';
            }
            
            next();
        } catch (error) {
            console.error('Error loading user details:', error);
            req.session.destroy(err => {
                if (err) console.error('Session destruction error during user load:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Server error loading user data. Please try again.' 
                });
            });
        }
    } else {
        next();
    }
};

/**
 * Check role for admin access
 */
const isAdmin = async (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    console.warn(`Access denied to ${req.path}: Not an administrator.`);
    res.status(403).json({ success: false, message: 'Access denied: Not an administrator.' });
};

/**
 * Check role for technician access
 */
const isTechnician = async (req, res, next) => {
    if (req.session.user && req.session.user.role === 'technician') {
        return next();
    }
    console.warn(`Access denied to ${req.path}: Not a technician.`);
    res.status(403).json({ success: false, message: 'Access denied: Not a technician.' });
};

/**
 * Check role for user access
 */
const isUser = async (req, res, next) => {
    if (req.session.user && req.session.user.role === 'user') {
        return next();
    }
    console.warn(`Access denied to ${req.path}: Not a user.`);
    res.status(403).json({ success: false, message: 'Access denied: Not a user.' });
};

/**
 * Dynamic role authorization
 * @param {string[]} roles - Array of allowed roles
 */
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.warn(`[AUTHORIZE ROLE] No user in req.user for path: ${req.path}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required for this resource.' 
            });
        }
        
        console.log(`[AUTHORIZE ROLE] User ${req.user.email} (Role: ${req.user.role}) accessing: ${req.path}. Required: ${roles.join(', ')}`);

        if (roles.includes(req.user.role)) {
            return next();
        }
        
        // Superadmin can access all admin-level endpoints
        const adminRoles = ['Citymanager', 'Serviceadmin', 'Financeofficer', 'Supportagent'];
        if (req.user.role === 'Superadmin' && roles.some(role => adminRoles.includes(role))) {
            console.log(`[AUTHORIZE ROLE] Superadmin ${req.user.email} granted access.`);
            return next();
        }

        console.warn(`[AUTHORIZE ROLE] Access denied for ${req.user.email} (Role: ${req.user.role})`);
        res.status(403).json({ 
            success: false, 
            message: `Access denied. Your role: ${req.user.role}` 
        });
    };
};

module.exports = {
    isAuthenticated,
    authenticateToken,
    loadUser,
    isAdmin,
    isTechnician,
    isUser,
    authorizeRoles
};
