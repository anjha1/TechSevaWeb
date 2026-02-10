/**
 * Admin Controller
 * Handles admin operations: users, jobs, KYC, settings, reports
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const { 
    User, Job, ApplianceType, Location, Ticket, 
    Promotion, Announcement, ContactMessage, 
    FeeRecommendation, FinancialLog, Transaction 
} = require('../models');
const { response, logger } = require('../utils');
const { sendAdminCredentials, sendPasswordResetEmail } = require('../services/email.service');
const config = require('../config/env');

/**
 * Dashboard overview for Superadmin
 */
const getDashboardOverview = async (req, res) => {
    logger.info('ADMIN', 'Dashboard overview request');
    try {
        const totalJobs = await Job.countDocuments();
        const activeTechnicians = await User.countDocuments({ role: 'technician', kycStatus: 'approved', status: 'active' });
        const totalCustomers = await User.countDocuments({ role: 'user' });
        const pendingApprovals = await User.countDocuments({ role: 'technician', kycStatus: 'pending' });
        const openTickets = await Ticket.countDocuments({ status: { $in: ['Open', 'In Progress', 'Escalated'] } });
        const activeLocations = await Location.countDocuments({ status: 'active' });
        const activeCoupons = await Promotion.countDocuments({ status: 'Active', expiryDate: { $gt: Date.now() } });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const revenueResult = await Job.aggregate([
            {
                $match: {
                    'payment.status': 'Paid',
                    'payment.paidAt': { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, totalRevenue: { $sum: '$payment.amount' } } }
        ]);
        const revenueThisMonth = revenueResult[0]?.totalRevenue || 0;

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const totalTransactionsLast30Days = await Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        return response.success(res, 'Dashboard data retrieved', {
            data: {
                totalJobs,
                activeTechnicians,
                totalCustomers,
                revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
                pendingApprovals,
                openTickets,
                totalTransactionsLast30Days,
                activeLocations,
                activeCoupons
            }
        });

    } catch (err) {
        logger.error('ADMIN', 'Dashboard overview error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Get all users (with role-based filtering)
 */
const getUsers = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'Citymanager' && req.user.assignedCities?.length > 0) {
            query.$or = [
                { role: 'user', city: { $in: req.user.assignedCities } },
                { role: 'technician', 'workingLocation.city': { $in: req.user.assignedCities } }
            ];
        } else if (req.user.role === 'Serviceadmin' && req.user.skills?.length > 0) {
            query.role = 'technician';
            query.skills = { $in: req.user.skills };
        }

        const users = await User.find(query).select('-password').lean();
        return response.success(res, `Found ${users.length} users`, { users });

    } catch (err) {
        logger.error('ADMIN', 'Get users error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Get all jobs (with role-based filtering)
 */
const getJobs = async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'Citymanager' && req.user.assignedCities?.length > 0) {
            query['location.city'] = { $in: req.user.assignedCities };
        } else if (req.user.role === 'Serviceadmin' && req.user.skills?.length > 0) {
            query.applianceType = { $in: req.user.skills };
        }

        const jobs = await Job.find(query)
            .populate('userId', 'fullName email phoneNumber')
            .populate('assignedTechnicianId', 'fullName email phoneNumber')
            .lean();

        const enhancedJobs = jobs.map(job => ({
            ...job,
            customerName: job.userId?.fullName || 'N/A',
            customerEmail: job.userId?.email || 'N/A',
            customerPhoneNumber: job.userId?.phoneNumber || 'N/A',
            technicianName: job.assignedTechnicianId?.fullName || 'Pending Assignment',
            technicianEmail: job.assignedTechnicianId?.email || 'N/A',
            technicianPhoneNumber: job.assignedTechnicianId?.phoneNumber || 'N/A',
            userId: job.userId?._id?.toString() || null,
            assignedTechnicianId: job.assignedTechnicianId?._id?.toString() || null
        }));

        return response.success(res, `Found ${enhancedJobs.length} jobs`, { jobs: enhancedJobs });

    } catch (err) {
        logger.error('ADMIN', 'Get jobs error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Assign technician to job
 */
const assignTechnician = async (req, res) => {
    logger.info('ADMIN', 'Assign technician request', { jobId: req.body.jobId });
    try {
        const { jobId, technicianId } = req.body;

        const job = await Job.findOne({ jobId });
        if (!job) {
            return response.notFound(res, 'Job not found.');
        }

        const technician = await User.findById(technicianId);
        if (!technician || technician.role !== 'technician' || technician.kycStatus !== 'approved') {
            return response.notFound(res, 'Technician not found or not approved.');
        }

        if (req.user.role === 'Serviceadmin' && !technician.skills.some(s => req.user.skills.includes(s))) {
            return response.forbidden(res, 'You can only assign technicians under your services.');
        }

        job.assignedTechnicianId = technician._id;
        job.assignedTechnicianName = technician.fullName;
        if (job.status === 'Pending') job.status = 'Accepted';

        await job.save();

        logger.info('ADMIN', 'Technician assigned', { jobId, technicianId });
        return response.success(res, `Technician ${technician.fullName} assigned.`, { job: job.toJSON() });

    } catch (err) {
        logger.error('ADMIN', 'Assign technician error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Approve technician KYC
 */
const approveTechnicianKYC = async (req, res) => {
    logger.info('ADMIN', 'Approve KYC request', { userId: req.params.userId });
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user || user.role !== 'technician') {
            return response.notFound(res, 'Technician not found.');
        }

        if (user.kycStatus === 'approved') {
            return response.badRequest(res, 'Technician already approved.');
        }

        user.kycStatus = 'approved';
        await user.save();

        logger.info('ADMIN', 'KYC approved', { userId });
        return response.success(res, 'Technician KYC approved.', { user: user.toJSON() });

    } catch (err) {
        logger.error('ADMIN', 'Approve KYC error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Reject technician KYC
 */
const rejectTechnicianKYC = async (req, res) => {
    logger.info('ADMIN', 'Reject KYC request', { userId: req.params.userId });
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user || user.role !== 'technician') {
            return response.notFound(res, 'Technician not found.');
        }

        user.kycStatus = 'rejected';
        await user.save();

        logger.info('ADMIN', 'KYC rejected', { userId });
        return response.success(res, 'Technician KYC rejected.', { user: user.toJSON() });

    } catch (err) {
        logger.error('ADMIN', 'Reject KYC error', err);
        return response.serverError(res, 'Internal server error.');
    }
};

/**
 * Create admin user
 */
const createAdminUser = async (req, res) => {
    logger.info('ADMIN', 'Create admin user request');
    try {
        const { fullName, email, password, role, assignedCities = [], skills = [], sendEmail } = req.body;

        if (!User.isAdminRole(role)) {
            return response.badRequest(res, 'Invalid admin role specified.');
        }

        let adminPassword = password;
        if (!adminPassword) {
            adminPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
        }

        const newAdmin = new User({
            fullName,
            email,
            password: adminPassword,
            role,
            assignedCities: role === 'Citymanager' ? assignedCities : [],
            skills: role === 'Serviceadmin' ? skills : [],
            isVerified: true,
            kycStatus: 'approved'
        });
        
        await newAdmin.save();

        if (sendEmail) {
            await sendAdminCredentials({ email, fullName, role, password: adminPassword });
        }

        logger.info('ADMIN', 'Admin user created', { email, role });
        return response.created(res, `Admin user (${role}) created successfully!`);

    } catch (error) {
        logger.error('ADMIN', 'Create admin user error', error);
        if (error.code === 11000) {
            return response.conflict(res, 'Email already exists.');
        }
        return response.serverError(res, 'Failed to create admin user.');
    }
};

/**
 * Update user status
 */
const updateUserStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    try {
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return response.notFound(res, 'User not found.');
        }

        if (userToUpdate._id.toString() === req.user._id.toString()) {
            return response.badRequest(res, 'You cannot change your own status.');
        }

        // Role-based checks
        if (req.user.role === 'Citymanager') {
            if (!['user', 'technician'].includes(userToUpdate.role)) {
                return response.forbidden(res, 'Citymanager cannot manage admin roles.');
            }
        }
        
        if (req.user.role === 'Serviceadmin' && userToUpdate.role !== 'technician') {
            return response.forbidden(res, 'Service Admin can only manage technicians.');
        }

        if (userToUpdate.role === 'Superadmin' && req.user.role !== 'Superadmin') {
            return response.forbidden(res, 'Only Superadmin can manage other Superadmins.');
        }

        userToUpdate.status = status;
        await userToUpdate.save();

        return response.success(res, `User status updated to ${status}.`);

    } catch (error) {
        logger.error('ADMIN', 'Update user status error', error);
        return response.serverError(res, 'Failed to update user status.');
    }
};

/**
 * Reset user password
 */
const resetUserPassword = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const user = await User.findById(userId);
        if (!user) {
            return response.notFound(res, 'User not found.');
        }

        if (user.googleId && !user.password) {
            return response.badRequest(res, 'Cannot reset password for Google-only accounts.');
        }

        if (user._id.toString() === req.user._id.toString()) {
            return response.badRequest(res, 'Cannot reset your own password via this endpoint.');
        }

        const newPassword = crypto.randomBytes(8).toString('base64').slice(0, 12);
        user.password = newPassword;
        await user.save();

        await sendPasswordResetEmail({ email: user.email, fullName: user.fullName, newPassword });

        return response.success(res, 'New password sent to user\'s email.');

    } catch (error) {
        logger.error('ADMIN', 'Reset user password error', error);
        return response.serverError(res, 'Failed to reset user password.');
    }
};

// Appliance Types CRUD
const getApplianceTypes = async (req, res) => {
    try {
        const types = await ApplianceType.find({});
        return response.success(res, 'Appliance types retrieved', { applianceTypes: types });
    } catch (error) {
        return response.serverError(res, 'Failed to fetch appliance types.');
    }
};

const createApplianceType = async (req, res) => {
    try {
        const { name, description, isActive, basePrice, commissionRate } = req.body;
        const newAppliance = new ApplianceType({ name, description, isActive, basePrice, commissionRate });
        await newAppliance.save();
        return response.created(res, 'Appliance type added!', { appliance: newAppliance });
    } catch (error) {
        if (error.code === 11000) return response.conflict(res, 'Appliance type already exists.');
        return response.serverError(res, 'Failed to add appliance type.');
    }
};

const updateApplianceType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive, basePrice, commissionRate } = req.body;
        const updated = await ApplianceType.findByIdAndUpdate(id, { name, description, isActive, basePrice, commissionRate }, { new: true });
        if (!updated) return response.notFound(res, 'Appliance type not found.');
        return response.success(res, 'Appliance type updated!', { appliance: updated });
    } catch (error) {
        if (error.code === 11000) return response.conflict(res, 'Name already exists.');
        return response.serverError(res, 'Failed to update.');
    }
};

const deleteApplianceType = async (req, res) => {
    try {
        await ApplianceType.findByIdAndDelete(req.params.id);
        return response.success(res, 'Appliance type deleted!');
    } catch (error) {
        return response.serverError(res, 'Failed to delete.');
    }
};

// Locations CRUD
const getLocations = async (req, res) => {
    try {
        const locations = await Location.find({});
        return response.success(res, 'Locations retrieved', { locations });
    } catch (error) {
        return response.serverError(res, 'Failed to fetch locations.');
    }
};

const createLocation = async (req, res) => {
    try {
        const { city, state, country, pincodes, status } = req.body;
        const newLocation = new Location({ city, state, country, pincodes, status });
        await newLocation.save();
        return response.created(res, 'Location added!', { location: newLocation });
    } catch (error) {
        if (error.code === 11000) return response.conflict(res, 'Location already exists.');
        return response.serverError(res, 'Failed to add location.');
    }
};

const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { city, state, country, pincodes, status } = req.body;
        const updated = await Location.findByIdAndUpdate(id, { city, state, country, pincodes, status }, { new: true });
        if (!updated) return response.notFound(res, 'Location not found.');
        return response.success(res, 'Location updated!', { location: updated });
    } catch (error) {
        if (error.code === 11000) return response.conflict(res, 'City already exists.');
        return response.serverError(res, 'Failed to update.');
    }
};

const deleteLocation = async (req, res) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        return response.success(res, 'Location deleted!');
    } catch (error) {
        return response.serverError(res, 'Failed to delete.');
    }
};

// Tickets
const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .populate('raisedBy', 'fullName email role')
            .populate('assignedTo', 'fullName email role')
            .lean();

        const processedTickets = tickets.map(ticket => ({
            ...ticket,
            raisedByDisplay: ticket.raisedBy ? `${ticket.raisedBy.fullName} (${ticket.raisedBy.email})` : 'Unknown',
            assignedToDisplay: ticket.assignedTo ? `${ticket.assignedTo.fullName} (${ticket.assignedTo.email})` : 'Unassigned'
        }));

        return response.success(res, 'Tickets retrieved', { tickets: processedTickets });
    } catch (error) {
        return response.serverError(res, 'Failed to fetch tickets.');
    }
};

const assignTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { assignedTo } = req.body;

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return response.notFound(res, 'Ticket not found.');

        const assignee = await User.findById(assignedTo);
        if (!assignee || !User.isAdminRole(assignee.role)) {
            return response.badRequest(res, 'Invalid assignee.');
        }

        ticket.assignedTo = assignee._id;
        ticket.status = 'In Progress';
        ticket.lastUpdate = new Date();
        await ticket.save();

        return response.success(res, `Ticket assigned to ${assignee.fullName}.`);
    } catch (error) {
        return response.serverError(res, 'Failed to assign ticket.');
    }
};

const resolveTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return response.notFound(res, 'Ticket not found.');

        ticket.status = 'Resolved';
        ticket.lastUpdate = new Date();
        await ticket.save();

        return response.success(res, 'Ticket resolved.');
    } catch (error) {
        return response.serverError(res, 'Failed to resolve ticket.');
    }
};

const closeTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return response.notFound(res, 'Ticket not found.');

        ticket.status = 'Closed';
        ticket.lastUpdate = new Date();
        await ticket.save();

        return response.success(res, 'Ticket closed.');
    } catch (error) {
        return response.serverError(res, 'Failed to close ticket.');
    }
};

// Transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        return response.success(res, 'Transactions retrieved', { transactions });
    } catch (error) {
        return response.serverError(res, 'Failed to fetch transactions.');
    }
};

// Contact Messages
const getContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        return response.success(res, 'Messages retrieved', { messages });
    } catch (error) {
        return response.serverError(res, 'Failed to fetch messages.');
    }
};

const deleteContactMessage = async (req, res) => {
    try {
        await ContactMessage.findByIdAndDelete(req.params.id);
        return response.success(res, 'Message deleted!');
    } catch (error) {
        return response.serverError(res, 'Failed to delete message.');
    }
};

module.exports = {
    getDashboardOverview,
    getUsers,
    getJobs,
    assignTechnician,
    approveTechnicianKYC,
    rejectTechnicianKYC,
    createAdminUser,
    updateUserStatus,
    resetUserPassword,
    getApplianceTypes,
    createApplianceType,
    updateApplianceType,
    deleteApplianceType,
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    getTickets,
    assignTicket,
    resolveTicket,
    closeTicket,
    getTransactions,
    getContactMessages,
    deleteContactMessage
};
