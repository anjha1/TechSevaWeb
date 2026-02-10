/**
 * Transaction Model
 * Financial movements within the system
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: String, sparse: true },
    type: { 
        type: String, 
        enum: ['PaymentIn', 'Payout', 'Commission', 'Refund', 'FeeChange', 'Earning'], 
        required: true 
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Pending' },
    paymentMethod: { type: String },
    description: { type: String }
}, { timestamps: true });

transactionSchema.pre('save', async function(next) {
    if (this.isNew && !this.transactionId) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.transactionId = `TSTXN-${datePart}-${randomPart}`;
    }
    next();
});

// Static method to generate transactionId with prefix
transactionSchema.statics.generateTransactionId = function(prefix = 'TXN') {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${datePart}-${randomPart}`;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
