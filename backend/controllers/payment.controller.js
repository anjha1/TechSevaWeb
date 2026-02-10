/**
 * Payment Controller
 * Handles payment processing endpoints: Razorpay, COD, Instant payments
 */

const crypto = require('crypto');
const { Job, Transaction } = require('../models');
const { processAndSavePayment } = require('../services/payment.service');
const { response, logger } = require('../utils');
const config = require('../config/env');

/**
 * Create Razorpay Order
 * POST /api/create-razorpay-order
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        if (!amount || amount <= 0) {
            return response.badRequest(res, 'Invalid amount.');
        }

        // Generate a mock order ID for now (in production, integrate with actual Razorpay SDK)
        const orderId = 'order_' + crypto.randomBytes(8).toString('hex');

        logger.info('PAYMENT', 'Razorpay order created', { orderId, amount, jobId: notes?.jobId });

        return response.success(res, 'Order created successfully', {
            order: {
                id: orderId,
                amount: amount,
                currency: currency || 'INR',
                receipt: receipt
            },
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo'
        });

    } catch (error) {
        logger.error('PAYMENT', 'Create Razorpay order error', error);
        return response.serverError(res, 'Failed to create payment order.');
    }
};

/**
 * Verify Razorpay Payment
 * POST /api/verify-razorpay-payment
 */
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, jobId, amount } = req.body;

        if (!jobId || !amount) {
            return response.badRequest(res, 'Missing jobId or amount.');
        }

        // In production, verify signature with Razorpay secret
        // For now, we'll trust the payment and process it
        const paymentId = razorpay_payment_id || 'PAY_' + Date.now();

        // Process and save payment to database
        const result = await processAndSavePayment({
            jobId: jobId,
            totalAmount: amount,
            paymentMethod: 'Razorpay',
            paymentDetails: {
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                transactionId: paymentId
            }
        });

        if (result.success) {
            logger.info('PAYMENT', 'Razorpay payment verified and processed', { jobId, paymentId });
            return response.success(res, result.message, { 
                paymentId: paymentId,
                job: result.job 
            });
        } else {
            return response.badRequest(res, result.message);
        }

    } catch (error) {
        logger.error('PAYMENT', 'Verify Razorpay payment error', error);
        return response.serverError(res, 'Payment verification failed.');
    }
};

/**
 * Process COD Payment
 * POST /api/process-cod-payment
 */
const processCODPayment = async (req, res) => {
    try {
        const { jobId, amount } = req.body;

        if (!jobId || amount === undefined) {
            return response.badRequest(res, 'Missing jobId or amount.');
        }

        const paymentId = 'COD_' + Date.now();

        // Process and save payment to database
        const result = await processAndSavePayment({
            jobId: jobId,
            totalAmount: amount,
            paymentMethod: 'COD',
            paymentDetails: {
                transactionId: paymentId,
                confirmedAt: new Date()
            }
        });

        if (result.success) {
            logger.info('PAYMENT', 'COD payment processed', { jobId, paymentId });
            return response.success(res, result.message, { 
                paymentId: paymentId,
                job: result.job 
            });
        } else {
            return response.badRequest(res, result.message);
        }

    } catch (error) {
        logger.error('PAYMENT', 'Process COD payment error', error);
        return response.serverError(res, 'Failed to process COD payment.');
    }
};

/**
 * Process Instant Payment (Tatkaal)
 * POST /api/process-instant-payment
 */
const processInstantPayment = async (req, res) => {
    try {
        const { jobId, amount } = req.body;

        if (!jobId || amount === undefined) {
            return response.badRequest(res, 'Missing jobId or amount.');
        }

        const paymentId = 'INS_' + Date.now();

        // Process and save payment to database
        const result = await processAndSavePayment({
            jobId: jobId,
            totalAmount: amount,
            paymentMethod: 'Instant',
            paymentDetails: {
                transactionId: paymentId,
                paidAt: new Date()
            }
        });

        if (result.success) {
            logger.info('PAYMENT', 'Instant payment processed', { jobId, paymentId });
            return response.success(res, result.message, { 
                paymentId: paymentId,
                job: result.job 
            });
        } else {
            return response.badRequest(res, result.message);
        }

    } catch (error) {
        logger.error('PAYMENT', 'Process instant payment error', error);
        return response.serverError(res, 'Failed to process instant payment.');
    }
};

/**
 * Get Job Payment Status
 * GET /api/payment-status/:jobId
 */
const getPaymentStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findOne({ jobId }).select('jobId status payment').lean();

        if (!job) {
            return response.notFound(res, 'Job not found.');
        }

        return response.success(res, 'Payment status retrieved', {
            jobId: job.jobId,
            status: job.status,
            payment: job.payment
        });

    } catch (error) {
        logger.error('PAYMENT', 'Get payment status error', error);
        return response.serverError(res, 'Failed to get payment status.');
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    processCODPayment,
    processInstantPayment,
    getPaymentStatus
};
