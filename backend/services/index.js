/**
 * Services Index
 * Central export for all service modules
 */

const emailService = require('./email.service');
const otpService = require('./otp.service');
const paymentService = require('./payment.service');

module.exports = {
    ...emailService,
    ...otpService,
    ...paymentService
};
