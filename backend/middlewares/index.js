/**
 * Middlewares Index
 * Central export for all middleware modules
 */

const { 
    isAuthenticated, 
    authenticateToken, 
    loadUser, 
    isAdmin, 
    isTechnician, 
    isUser, 
    authorizeRoles 
} = require('./auth.middleware');

const { 
    notFoundHandler, 
    errorHandler, 
    asyncHandler 
} = require('./error.middleware');

module.exports = {
    // Authentication
    isAuthenticated,
    authenticateToken,
    loadUser,
    isAdmin,
    isTechnician,
    isUser,
    authorizeRoles,
    
    // Error Handling
    notFoundHandler,
    errorHandler,
    asyncHandler
};
