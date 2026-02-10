/**
 * Email Service
 * Handles all email-related functionality using Nodemailer
 */

const nodemailer = require('nodemailer');
const config = require('../config/env');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @param {string} subject - Email subject
 * @param {string} body - Email HTML body
 * @returns {Promise<boolean>} Success status
 */
const sendOTPEmail = async (email, otp, subject = 'Your TechSeva OTP', body = null) => {
    if (!config.email.user || !config.email.pass) {
        console.error('Email credentials not set. OTP email will not be sent.');
        return false;
    }
    
    const htmlBody = body || `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">TechSeva Verification</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p style="color: #666;">This OTP is valid for 5 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
    `;
    
    try {
        await transporter.sendMail({
            from: config.email.user,
            to: email,
            subject: subject,
            html: htmlBody
        });
        console.log(`OTP ${otp} sent to ${email}`);
        return true;
    } catch (err) {
        console.error('Email sending failed:', err);
        return false;
    }
};

/**
 * Send admin credentials email
 * @param {Object} params - Email parameters
 */
const sendAdminCredentials = async ({ email, fullName, role, password }) => {
    const subject = `TechSeva Admin Account Created - Role: ${role}`;
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Welcome to TechSeva Admin Panel</h2>
            <p>Dear ${fullName},</p>
            <p>Your admin account has been created with the role: <strong>${role}</strong></p>
            <p>Login URL: <a href="${config.frontendUrl}/admin-login">${config.frontendUrl}/admin-login</a></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Your Temporary Password:</strong> ${password}</p>
            </div>
            <p style="color: #dc3545;">Please change your password after first login.</p>
            <p>Thank you,<br>TechSeva Team</p>
        </div>
    `;
    
    try {
        await transporter.sendMail({
            from: config.email.user,
            to: email,
            subject: subject,
            html: htmlBody
        });
        return true;
    } catch (err) {
        console.error('Error sending admin credentials email:', err);
        return false;
    }
};

/**
 * Send password reset email
 * @param {Object} params - Email parameters
 */
const sendPasswordResetEmail = async ({ email, fullName, newPassword }) => {
    const subject = 'TechSeva Account Password Reset';
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Password Reset</h2>
            <p>Dear ${fullName},</p>
            <p>Your password has been reset by an administrator.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>New Temporary Password:</strong> ${newPassword}</p>
            </div>
            <p style="color: #dc3545;">Please log in and change your password immediately.</p>
            <p>Thank you,<br>TechSeva Team</p>
        </div>
    `;
    
    try {
        await transporter.sendMail({
            from: config.email.user,
            to: email,
            subject: subject,
            html: htmlBody
        });
        return true;
    } catch (err) {
        console.error('Error sending password reset email:', err);
        return false;
    }
};

/**
 * Send generic notification email
 * @param {Object} params - Email parameters
 */
const sendNotificationEmail = async ({ email, subject, htmlBody }) => {
    try {
        await transporter.sendMail({
            from: config.email.user,
            to: email,
            subject: subject,
            html: htmlBody
        });
        return true;
    } catch (err) {
        console.error('Error sending notification email:', err);
        return false;
    }
};

module.exports = {
    transporter,
    sendOTPEmail,
    sendAdminCredentials,
    sendPasswordResetEmail,
    sendNotificationEmail
};
