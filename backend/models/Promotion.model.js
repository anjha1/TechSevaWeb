/**
 * Promotion Model
 * Coupons and discount codes
 */

const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    couponCode: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    expiryDate: { type: Date, required: true },
    targetAudience: [{ type: String }],
    usageLimit: { type: Number, default: 1, min: 1 },
    totalUsageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending', 'Approved', 'Rejected'], default: 'Pending' },
    suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    suggestedCities: [{ type: String }],
    targetServices: [{ type: String }]
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
