/**
 * Location Model
 * Service areas and cities
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    city: { type: String, required: true, unique: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    pincodes: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
