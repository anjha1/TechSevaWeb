/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Not Found Handler (404)
 */
const notFoundHandler = (req, res, next) => {
    if (req.accepts('html')) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 - Page Not Found</title>
                <style>
                    body { font-family: sans-serif; text-align: center; margin-top: 50px; background-color: #f4f7f6; color: #333; }
                    h1 { font-size: 3em; color: #dc3545; }
                    p { font-size: 1.2em; }
                    a { color: #007bff; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <h1>404 - Page Not Found</h1>
                <p>Oops! The page you are looking for might have been removed or is temporarily unavailable.</p>
                <p><a href="/">Go to Homepage</a></p>
            </body>
            </html>
        `);
    }
    
    console.warn(`[404 Handler] API request for ${req.path} - Endpoint Not Found.`);
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found.' 
    });
};

/**
 * Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
    console.error('[ERROR HANDLER]:', err.stack);

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ 
            success: false, 
            message: `A record with this ${field} already exists.` 
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
            success: false, 
            message: 'Validation error',
            errors: messages 
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            success: false, 
            message: `Invalid ${err.path}: ${err.value}` 
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            success: false, 
            message: 'Token expired.' 
        });
    }

    // Default server error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler
};
