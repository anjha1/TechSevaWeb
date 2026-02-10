/**
 * Payment Routes
 * Handles payment processing: Razorpay, COD, Instant payments
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { isAuthenticated, loadUser } = require('../middlewares');

// All payment routes require authentication
router.use(isAuthenticated);
router.use(loadUser);

// Razorpay
router.post('/create-razorpay-order', paymentController.createRazorpayOrder);
router.post('/verify-razorpay-payment', paymentController.verifyRazorpayPayment);

// COD
router.post('/process-cod-payment', paymentController.processCODPayment);

// Instant Payment
router.post('/process-instant-payment', paymentController.processInstantPayment);

// Payment Status
router.get('/payment-status/:jobId', paymentController.getPaymentStatus);

module.exports = router;
