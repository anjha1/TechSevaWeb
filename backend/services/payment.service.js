/**
 * Payment Service
 * Handles payment processing, technician earnings, and transactions
 */

const config = require('../config/env');
const { Job, User, Transaction } = require('../models');

/**
 * Process and save payment for a job
 * @param {Object} params - Payment parameters
 * @returns {Object} Processing result
 */
const processAndSavePayment = async ({ jobId, totalAmount, paymentMethod, paymentDetails }) => {
    try {
        const job = await Job.findOne({ jobId });

        if (!job) {
            return { success: false, message: 'Job not found.' };
        }

        // Check job status for payment eligibility
        if (job.status !== 'Diagnosed' && job.status !== 'Completed' && !job.isWarrantyClaim) {
            return { 
                success: false, 
                message: `Payment can only be processed for 'Diagnosed' or 'Completed' jobs. Current status: ${job.status}.` 
            };
        }
        
        // Handle warranty claim with zero amount
        if (job.isWarrantyClaim && totalAmount === 0 && paymentMethod === 'COD') {
            console.log(`[PAYMENT SERVICE] Warranty claim for job ${jobId} has zero total.`);
            job.status = 'Paid';
            await job.save();
            return { 
                success: true, 
                message: 'Warranty job confirmed. No payment needed from customer.',
                job: job.toJSON()
            };
        }

        // Update job payment details
        job.payment = {
            amount: parseFloat(totalAmount),
            method: paymentMethod,
            details: paymentDetails,
            status: 'Paid',
            paidAt: new Date(),
            transactionId: paymentDetails?.transactionId || Transaction.generateTransactionId('PAY')
        };
        job.status = 'Paid';

        await job.save();

        // Create PaymentIn transaction
        await Transaction.create({
            transactionId: Transaction.generateTransactionId('TXN'),
            userId: job.userId,
            relatedUserId: job.assignedTechnicianId,
            jobId: job.jobId,
            type: 'PaymentIn',
            amount: job.payment.amount,
            status: 'Success',
            paymentMethod: job.payment.method,
            description: `Customer payment for Job ${job.jobId}`
        });

        // Process technician earnings
        if (job.assignedTechnicianId && job.quotation?.totalEstimate !== undefined) {
            if (job.isWarrantyClaim) {
                await processWarrantyEarnings(job);
            } else {
                await processNormalEarnings(job);
            }
        }
        
        return { 
            success: true, 
            message: 'Payment processed successfully and job marked as Paid!', 
            job: job.toJSON() 
        };

    } catch (err) {
        console.error('[PAYMENT SERVICE ERROR]:', err);
        return { 
            success: false, 
            message: 'Internal server error during payment processing.' 
        };
    }
};

/**
 * Process earnings for warranty claims (technician paid by app)
 */
const processWarrantyEarnings = async (job) => {
    const technicianPayout = (job.quotation.partCost || 0) + 
                              (job.quotation.laborCost || 0) + 
                              (job.quotation.travelCharges || 0);
    
    if (technicianPayout > 0) {
        await User.findByIdAndUpdate(
            job.assignedTechnicianId,
            { $inc: { balance: technicianPayout, jobsCompleted: 1 } },
            { new: true }
        );
        
        await Transaction.create({
            transactionId: Transaction.generateTransactionId('TXNE'),
            userId: job.assignedTechnicianId,
            relatedUserId: job.userId,
            jobId: job.jobId,
            type: 'Earning',
            amount: technicianPayout,
            status: 'Success',
            description: `Technician earning for Warranty Job ${job.jobId} (Paid by App)`
        });
    }
};

/**
 * Process normal earnings with commission and tax deductions
 */
const processNormalEarnings = async (job) => {
    const grossAmount = job.quotation.totalEstimate;
    const appCommission = grossAmount * config.appCommissionRate;
    const amountBeforeTax = grossAmount - appCommission;
    const technicianTaxDeduction = amountBeforeTax * config.taxRateIndia;
    const technicianNetEarning = amountBeforeTax - technicianTaxDeduction;

    if (technicianNetEarning > 0) {
        await User.findByIdAndUpdate(
            job.assignedTechnicianId,
            { $inc: { balance: technicianNetEarning, jobsCompleted: 1 } },
            { new: true }
        );
        
        // Create earning transaction
        await Transaction.create({
            transactionId: Transaction.generateTransactionId('TXNE'),
            userId: job.assignedTechnicianId,
            relatedUserId: job.userId,
            jobId: job.jobId,
            type: 'Earning',
            amount: technicianNetEarning,
            status: 'Success',
            description: `Technician earning for Job ${job.jobId}`
        });
        
        // Create commission transaction
        await Transaction.create({
            transactionId: Transaction.generateTransactionId('TXNC'),
            userId: job.assignedTechnicianId,
            relatedUserId: job.userId,
            jobId: job.jobId,
            type: 'Commission',
            amount: appCommission,
            status: 'Success',
            description: `Platform commission from Job ${job.jobId}`
        });
    }
};

/**
 * Calculate earnings breakdown for a job
 * @param {number} grossAmount - Total job amount
 * @returns {Object} Earnings breakdown
 */
const calculateEarningsBreakdown = (grossAmount) => {
    const appCommission = grossAmount * config.appCommissionRate;
    const amountBeforeTax = grossAmount - appCommission;
    const technicianTaxDeduction = amountBeforeTax * config.taxRateIndia;
    const technicianNetEarning = amountBeforeTax - technicianTaxDeduction;
    
    return {
        grossAmount,
        appCommission,
        amountBeforeTax,
        technicianTaxDeduction,
        technicianNetEarning
    };
};

/**
 * Process payout for technician
 * @param {Object} params - Payout parameters
 * @returns {Object} Processing result
 */
const processTechnicianPayout = async ({ technicianId, amount, processedBy }) => {
    try {
        const technician = await User.findById(technicianId);
        
        if (!technician || technician.role !== 'technician') {
            return { success: false, message: 'Technician not found.' };
        }
        
        if (technician.balance < amount) {
            return { success: false, message: 'Insufficient balance.' };
        }
        
        const hasBankDetails = technician.bankDetails?.accountNumber && 
                               technician.bankDetails?.bankName && 
                               technician.bankDetails?.ifscCode;
        const hasUpiId = technician.bankDetails?.upiId;
        
        if (!hasBankDetails && !hasUpiId) {
            return { 
                success: false, 
                message: 'Please provide bank account details or UPI ID before withdrawing.' 
            };
        }
        
        technician.balance -= amount;
        await technician.save();
        
        await Transaction.create({
            transactionId: Transaction.generateTransactionId('TXNP'),
            userId: technicianId,
            relatedUserId: processedBy,
            type: 'Payout',
            amount: amount,
            status: 'Pending',
            description: `Payout request for technician ${technician.fullName}`
        });
        
        return { 
            success: true, 
            message: `Withdrawal of ₹${amount.toFixed(2)} initiated. New balance: ₹${technician.balance.toFixed(2)}` 
        };
        
    } catch (err) {
        console.error('[PAYOUT SERVICE ERROR]:', err);
        return { success: false, message: 'Error processing payout.' };
    }
};

module.exports = {
    processAndSavePayment,
    calculateEarningsBreakdown,
    processTechnicianPayout
};
