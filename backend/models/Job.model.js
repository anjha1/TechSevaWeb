/**
 * Job Model
 * Represents service bookings and their lifecycle
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const jobSchema = new mongoose.Schema({
    jobId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: String,
    customerEmail: String,
    customerPhoneNumber: String,
    applianceType: { type: String, required: true },
    problemDescription: String,
    location: {
        pincode: { type: String },
        state: { type: String },
        city: { type: String },
        houseBuilding: { type: String },
        street: { type: String },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    scheduledDateTime: { type: Date, required: true },
    notes: String,
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Accepted', 'In Progress', 'Diagnosed', 'Quotation Approved', 'Paid', 'Completed', 'Cancelled'] 
    },
    assignedTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTechnicianName: String,
    faultyParts: [String],
    technicianRemarks: String,
    quotation: {
        partCost: Number,
        laborCost: Number,
        travelCharges: Number,
        totalEstimate: Number,
        createdAt: Date
    },
    payment: {
        amount: Number,
        method: String,
        details: Object,
        status: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
        paidAt: Date,
        transactionId: { type: String, unique: true, sparse: true }
    },
    completedAt: Date,
    rating: { type: Number, min: 1, max: 5 },
    reviewText: String,
    reviewedAt: Date,
    proofImages: [String],
    technicianProposals: [{
        technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        priceQuote: { type: Number },
        proposedAt: { type: Date }
    }],
    isWarrantyClaim: { type: Boolean, default: false },
    originalJobId: { type: String }
}, { timestamps: true });

// Auto-generate jobId
jobSchema.pre('save', async function(next) {
    if (this.isNew && !this.jobId) {
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.jobId = `TSJ-${datePart}-${randomPart}`;
    }
    next();
});

// Static method to generate jobId
jobSchema.statics.generateJobId = function() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TSJ-${datePart}-${randomPart}`;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
