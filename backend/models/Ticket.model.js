/**
 * Ticket Model
 * Support tickets and complaints
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, unique: true, required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Escalated'], default: 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdate: { type: Date, default: Date.now },
    serviceType: { type: String },
    escalationReason: { type: String },
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Static method to generate ticketId
ticketSchema.statics.generateTicketId = function() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `TST-${datePart}-${randomPart}`;
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
