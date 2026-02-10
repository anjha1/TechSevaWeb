/**
 * Contact Routes
 * API routes for contact form submissions and inquiries
 */

const express = require('express');
const router = express.Router();
const { ContactMessage: Contact, User } = require('../models');
const emailService = require('../services/email.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const { isAuthenticated } = require('../middlewares/auth.middleware');

/**
 * POST /api/contact
 * Submit contact form (public)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message, type = 'general' } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return error(res, 'Name, email and message are required', 400);
        }
        
        // Create contact entry
        const contact = new Contact({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim(),
            subject: subject?.trim() || 'General Inquiry',
            message: message.trim(),
            type,
            status: 'pending',
            createdAt: new Date()
        });
        
        await contact.save();
        
        // Send acknowledgment email
        try {
            await emailService.sendMail({
                to: email,
                subject: 'Thank you for contacting TechSeva',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Thank You for Reaching Out!</h2>
                        <p>Hi ${name},</p>
                        <p>We have received your message and will get back to you within 24-48 hours.</p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                            <p><strong>Message:</strong> ${message}</p>
                        </div>
                        <p>If you have any urgent queries, please call us at <strong>+91-XXXXXXXXXX</strong></p>
                        <br>
                        <p>Best regards,</p>
                        <p><strong>TechSeva Support Team</strong></p>
                    </div>
                `
            });
        } catch (emailErr) {
            logger.error('Failed to send contact acknowledgment email', emailErr);
        }
        
        // Notify admin (optional)
        try {
            const admins = await User.find({ role: { $in: ['Superadmin', 'Supportagent'] } }).select('email');
            if (admins.length > 0) {
                await emailService.sendMail({
                    to: admins.map(a => a.email).join(','),
                    subject: `New Contact Form Submission: ${subject || 'General Inquiry'}`,
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h3>New Contact Form Submission</h3>
                            <p><strong>From:</strong> ${name} (${email})</p>
                            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                            <p><strong>Type:</strong> ${type}</p>
                            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                            <p><strong>Message:</strong></p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                                ${message}
                            </div>
                            <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/supportagent">View in Dashboard</a></p>
                        </div>
                    `
                });
            }
        } catch (adminEmailErr) {
            logger.error('Failed to notify admin about contact', adminEmailErr);
        }
        
        logger.info(`New contact form submission from ${email}`);
        
        return success(res, { id: contact._id }, 'Message sent successfully');
        
    } catch (err) {
        logger.error('Contact form error', err);
        return error(res, 'Failed to send message', 500);
    }
});

/**
 * GET /api/contact/messages
 * Get all contact messages (Admin only)
 */
router.get('/messages', isAuthenticated, async (req, res) => {
    try {
        // Check admin role
        const adminRoles = ['Superadmin', 'Supportagent'];
        if (!adminRoles.includes(req.session.user?.role)) {
            return error(res, 'Unauthorized', 403);
        }
        
        const { status, type, page = 1, limit = 20 } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [messages, total] = await Promise.all([
            Contact.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Contact.countDocuments(query)
        ]);
        
        return success(res, {
            messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (err) {
        logger.error('Get contacts error', err);
        return error(res, 'Failed to fetch messages', 500);
    }
});

/**
 * PUT /api/contact/messages/:id/status
 * Update message status (Admin only)
 */
router.put('/messages/:id/status', isAuthenticated, async (req, res) => {
    try {
        const adminRoles = ['Superadmin', 'Supportagent'];
        if (!adminRoles.includes(req.session.user?.role)) {
            return error(res, 'Unauthorized', 403);
        }
        
        const { status, response } = req.body;
        
        if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
            return error(res, 'Invalid status', 400);
        }
        
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status,
                response,
                resolvedBy: req.session.user.id,
                resolvedAt: status === 'resolved' ? new Date() : undefined
            },
            { new: true }
        );
        
        if (!contact) {
            return error(res, 'Message not found', 404);
        }
        
        // Send response email if provided
        if (response && contact.email) {
            try {
                await emailService.sendMail({
                    to: contact.email,
                    subject: `Re: ${contact.subject || 'Your Query'} - TechSeva Support`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">Response to Your Query</h2>
                            <p>Hi ${contact.name},</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Your Query:</strong></p>
                                <p style="color: #6b7280;">${contact.message}</p>
                            </div>
                            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Our Response:</strong></p>
                                <p>${response}</p>
                            </div>
                            <p>If you have any further questions, feel free to reply to this email.</p>
                            <br>
                            <p>Best regards,</p>
                            <p><strong>TechSeva Support Team</strong></p>
                        </div>
                    `
                });
            } catch (emailErr) {
                logger.error('Failed to send response email', emailErr);
            }
        }
        
        return success(res, contact, 'Status updated successfully');
        
    } catch (err) {
        logger.error('Update contact status error', err);
        return error(res, 'Failed to update status', 500);
    }
});

/**
 * DELETE /api/contact/messages/:id
 * Delete a message (Superadmin only)
 */
router.delete('/messages/:id', isAuthenticated, async (req, res) => {
    try {
        if (req.session.user?.role !== 'Superadmin') {
            return error(res, 'Unauthorized', 403);
        }
        
        const contact = await Contact.findByIdAndDelete(req.params.id);
        
        if (!contact) {
            return error(res, 'Message not found', 404);
        }
        
        return success(res, null, 'Message deleted successfully');
        
    } catch (err) {
        logger.error('Delete contact error', err);
        return error(res, 'Failed to delete message', 500);
    }
});

module.exports = router;
