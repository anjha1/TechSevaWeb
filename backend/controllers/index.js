/**
 * Controllers Index
 * Central export for all controller modules
 */

const authController = require('./auth.controller');
const userController = require('./user.controller');
const technicianController = require('./technician.controller');
const adminController = require('./admin.controller');
const paymentController = require('./payment.controller');

module.exports = {
    authController,
    userController,
    technicianController,
    adminController,
    paymentController
};
