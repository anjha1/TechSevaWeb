/**
 * Response Utility
 * Standardized API response helpers
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data
    });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const created = (res, message, data = {}) => {
    return success(res, message, data, 201);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} extra - Extra data to include
 */
const error = (res, message, statusCode = 500, extra = {}) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...extra
    });
};

/**
 * Bad Request response (400)
 */
const badRequest = (res, message, extra = {}) => {
    return error(res, message, 400, extra);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (res, message = 'Unauthorized. Please login.', redirect = '/') => {
    return error(res, message, 401, { redirect });
};

/**
 * Forbidden response (403)
 */
const forbidden = (res, message = 'Access denied.') => {
    return error(res, message, 403);
};

/**
 * Not Found response (404)
 */
const notFound = (res, message = 'Resource not found.') => {
    return error(res, message, 404);
};

/**
 * Conflict response (409) - for duplicate entries
 */
const conflict = (res, message) => {
    return error(res, message, 409);
};

/**
 * Server Error response (500)
 */
const serverError = (res, message = 'Internal server error.') => {
    return error(res, message, 500);
};

/**
 * Validation Error response (400) with errors array
 */
const validationError = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
    });
};

module.exports = {
    success,
    created,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    serverError,
    validationError
};
