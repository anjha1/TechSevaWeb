/**
 * User Model
 * Unified model for all user types: customer, technician, admin roles
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    phoneNumber: { type: String, sparse: true },
    otp: { type: String },
    otpExpires: { type: Date },
    googleId: { type: String, unique: true, sparse: true },
    role: { 
        type: String, 
        enum: ['user', 'technician', 'Superadmin', 'Citymanager', 'Serviceadmin', 'Financeofficer', 'Supportagent'], 
        default: 'user' 
    },
    isVerified: { type: Boolean, default: false },
    profilePictureUrl: { type: String, default: 'https://placehold.co/120x120/E9ECEF/495057?text=U' },
    
    // Structured Address
    address: { 
        pincode: { type: String },
        state: { type: String },
        city: { type: String },
        houseBuilding: { type: String },
        street: { type: String },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    
    // Technician specific fields
    skills: [{ type: String }],
    experience: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    pan: { type: String, unique: true, sparse: true },
    aadhaar: { type: String, unique: true, sparse: true },
    workingLocation: {
        pincode: { type: String },
        city: { type: String },
        state: { type: String },
        street: { type: String },
        houseBuilding: { type: String },
        radiusKm: { type: Number, default: 10 },
        latitude: { type: Number },
        longitude: { type: Number }
    },
    availability: {
        availableDays: [String],
        startTime: String,
        endTime: String,
        emergencyCalls: { type: Boolean, default: false }
    },

    // Admin specific fields
    assignedCities: [{ type: String }],
    
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
    balance: { type: Number, default: 0 },
    bankDetails: {
        bankName: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        upiId: { type: String }
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isNew) {
        if (this.role === 'technician' && !this.kycStatus) {
            this.kycStatus = 'pending';
        } else if (this.role === 'user' && !this.kycStatus) {
            this.kycStatus = 'approved';
        }
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword) {
    if (this.password) {
        return bcrypt.compare(candidatePassword, this.password);
    }
    return Promise.resolve(false);
};

// Static method to check if role is admin type
userSchema.statics.isAdminRole = function(role) {
    return ['Superadmin', 'Citymanager', 'Serviceadmin', 'Financeofficer', 'Supportagent'].includes(role);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
