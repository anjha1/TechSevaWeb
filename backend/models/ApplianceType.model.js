/**
 * Appliance Type Model
 * Service categories with pricing configuration
 */

const mongoose = require('mongoose');
const config = require('../config/env');

const applianceTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    basePrice: { type: Number, default: 0 },
    commissionRate: { type: Number, default: config.appCommissionRate }
}, { timestamps: true });

const ApplianceType = mongoose.model('ApplianceType', applianceTypeSchema);

module.exports = ApplianceType;
