/**
 * Fee Recommendation Model
 * Pricing suggestions from admins
 */

const mongoose = require('mongoose');

const feeRecommendationSchema = new mongoose.Schema({
    serviceType: { type: String, required: true },
    feeType: { type: String, enum: ['basePrice', 'commissionRate', 'laborCost'], required: true },
    currentValue: { type: Number, required: true },
    newProposedValue: { type: Number, required: true },
    reason: { type: String, required: true },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminRole: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

const FeeRecommendation = mongoose.model('FeeRecommendation', feeRecommendationSchema);

module.exports = FeeRecommendation;
