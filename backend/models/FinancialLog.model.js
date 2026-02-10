/**
 * Financial Log Model
 * Audit trail for financial events
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const financialLogSchema = new mongoose.Schema({
    logId: { type: String, unique: true, required: true },
    eventType: { type: String, required: true },
    relatedId: { type: String },
    description: { type: String, required: true },
    amount: { type: Number },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reasonFlagged: { type: String },
    status: { type: String, enum: ['Normal', 'Flagged', 'Resolved Flag'], default: 'Normal' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

financialLogSchema.pre('save', async function(next) {
    if (this.isNew && !this.logId) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        this.logId = `TSL-${datePart}-${randomPart}`;
    }
    next();
});

// Static method to generate logId
financialLogSchema.statics.generateLogId = function() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `TSL-${datePart}-${randomPart}`;
};

const FinancialLog = mongoose.model('FinancialLog', financialLogSchema);

module.exports = FinancialLog;
