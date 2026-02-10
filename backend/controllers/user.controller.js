/**
 * User Controller
 * Handles customer-specific operations: profile, bookings, jobs, reviews
 */

const mongoose = require('mongoose');
const { User, Job, Announcement, Ticket } = require('../models');
const { response, logger } = require('../utils');

/**
 * Get current user details
 */
const getMe = async (req, res) => {
    if (!req.user) {
        return response.notFound(res, 'User data not found in session.');
    }
    return response.success(res, 'User data retrieved', { user: req.user });
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    logger.info('USER', 'Profile update request', { userId: req.user._id });
    try {
        const userId = req.user._id;
        const { fullName, phoneNumber: rawPhoneNumber, address } = req.body;
        const phoneNumber = rawPhoneNumber?.trim() || undefined;

        const user = await User.findById(userId);
        if (!user) {
            return response.notFound(res, 'User not found.');
        }

        // Handle phone number uniqueness
        if (phoneNumber && phoneNumber !== user.phoneNumber) {
            const existingPhone = await User.findOne({ 
                phoneNumber, 
                _id: { $ne: userId } 
            });
            if (existingPhone) {
                return response.conflict(res, 'This phone number is already registered.');
            }
            user.phoneNumber = phoneNumber;
        }

        if (fullName !== undefined) user.fullName = fullName;
        if (address !== undefined) user.address = address;
        
        await user.save();

        // Update session
        req.session.user.fullName = user.fullName;
        req.session.user.phoneNumber = user.phoneNumber;
        req.session.user.address = user.address;

        const updatedUser = await User.findById(userId).select('-password').lean();

        logger.info('USER', 'Profile updated', { userId });
        return response.success(res, 'Profile updated successfully!', { user: updatedUser });

    } catch (err) {
        logger.error('USER', 'Profile update error', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return response.conflict(res, `A user with this ${field} already exists.`);
        }
        return response.serverError(res, 'Internal server error during profile update.');
    }
};

/**
 * Upload profile photo
 */
const uploadPhoto = async (req, res) => {
    try {
        const { photoData } = req.body;
        const userId = req.user._id;

        if (!photoData) {
            return response.badRequest(res, 'Missing photo data.');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePictureUrl: photoData },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedUser) {
            return response.notFound(res, 'User not found.');
        }

        logger.info('USER', 'Profile photo updated', { userId });
        return response.success(res, 'Profile photo uploaded successfully!', { user: updatedUser });

    } catch (error) {
        logger.error('USER', 'Photo upload error', error);
        return response.serverError(res, 'Failed to upload photo.');
    }
};

/**
 * Update phone number (used after Google login)
 */
const updatePhone = async (req, res) => {
    logger.info('USER', 'Phone update request', { userId: req.user._id });
    try {
        const { phoneNumber } = req.body;
        const userId = req.user._id;

        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber.trim())) {
            return response.badRequest(res, 'Please provide a valid 10-digit phone number.');
        }

        const trimmedPhone = phoneNumber.trim();

        // Check uniqueness
        const existingPhone = await User.findOne({ 
            phoneNumber: trimmedPhone, 
            _id: { $ne: userId } 
        });
        if (existingPhone) {
            return response.conflict(res, 'This phone number is already registered.');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { phoneNumber: trimmedPhone },
            { new: true, runValidators: true }
        ).select('-password').lean();

        if (!updatedUser) {
            return response.notFound(res, 'User not found.');
        }

        req.session.user.phoneNumber = trimmedPhone;

        // Get redirect URL based on role
        const { getRedirectUrl } = require('./auth.controller');
        
        logger.info('USER', 'Phone number updated', { userId });
        return response.success(res, 'Phone number updated successfully!', {
            redirect: getRedirectUrl(updatedUser.role),
            user: updatedUser
        });

    } catch (error) {
        logger.error('USER', 'Phone update error', error);
        return response.serverError(res, 'Internal server error during phone update.');
    }
};

/**
 * Book a service
 */
const bookService = async (req, res) => {
    logger.info('USER', 'Book service request', { userId: req.session.user.id });
    try {
        const { applianceType, location, scheduledDateTime, notes, isWarrantyClaim, originalJobId } = req.body;
        const userId = req.session.user.id;

        // Validate required fields
        if (!applianceType || !location?.pincode || !location?.state || !location?.city || 
            !location?.houseBuilding || !location?.street || !scheduledDateTime) {
            return response.badRequest(res, 'Required fields missing for booking.');
        }

        const customer = await User.findById(userId);
        if (!customer) {
            return response.notFound(res, 'User not found.');
        }

        // Find available technician
        const availableTechnicians = await User.find({ 
            role: 'technician', 
            kycStatus: 'approved', 
            status: 'active' 
        });
        const assignedTechnician = availableTechnicians.length > 0 
            ? availableTechnicians[Math.floor(Math.random() * availableTechnicians.length)] 
            : null;

        const newJob = new Job({
            jobId: Job.generateJobId(),
            userId: customer._id,
            customerName: customer.fullName,
            customerEmail: customer.email,
            customerPhoneNumber: customer.phoneNumber,
            applianceType,
            location,
            scheduledDateTime: new Date(scheduledDateTime),
            notes,
            status: 'Pending',
            assignedTechnicianId: assignedTechnician?._id || null,
            assignedTechnicianName: assignedTechnician?.fullName || 'Pending Assignment',
            isWarrantyClaim: isWarrantyClaim === 'true' || isWarrantyClaim === true,
            originalJobId: originalJobId || null,
        });

        await newJob.save();

        logger.info('USER', 'Job created', { jobId: newJob.jobId });
        return response.created(res, 'Service booked successfully!', { job: newJob });

    } catch (err) {
        logger.error('USER', 'Book service error', err);
        return response.serverError(res, 'Internal server error during service booking.');
    }
};

/**
 * Get user's jobs
 */
const getJobs = async (req, res) => {
    try {
        const userJobs = await Job.find({ userId: req.user._id }).lean();
        return response.success(res, `Found ${userJobs.length} jobs`, { jobs: userJobs });
    } catch (err) {
        logger.error('USER', 'Get jobs error', err);
        return response.serverError(res, 'Internal server error while fetching jobs.');
    }
};

/**
 * Cancel a job
 */
const cancelJob = async (req, res) => {
    logger.info('USER', 'Cancel job request', { jobId: req.body.jobId });
    try {
        const { jobId } = req.body;
        
        const job = await Job.findOneAndUpdate(
            { 
                jobId, 
                userId: req.user._id, 
                status: { $in: ['Pending', 'Accepted'] } 
            },
            { $set: { status: 'Cancelled' } },
            { new: true }
        ).lean();

        if (!job) {
            return response.notFound(res, 'Job not found or cannot be cancelled.');
        }

        logger.info('USER', 'Job cancelled', { jobId });
        return response.success(res, 'Job cancelled successfully!');

    } catch (err) {
        logger.error('USER', 'Cancel job error', err);
        return response.serverError(res, 'Internal server error during job cancellation.');
    }
};

/**
 * Submit job review
 */
const submitReview = async (req, res) => {
    logger.info('USER', 'Submit review request', { jobId: req.body.jobId });
    try {
        const { jobId, rating, reviewText } = req.body;
        const userId = req.user._id;

        if (!jobId || rating === undefined || rating < 1 || rating > 5 || !reviewText) {
            return response.badRequest(res, 'Job ID, rating (1-5), and review text are required.');
        }

        const job = await Job.findOne({ jobId, userId });

        if (!job) {
            return response.notFound(res, 'Job not found or not associated with your account.');
        }

        if (job.rating || job.reviewedAt) {
            return response.badRequest(res, 'This job has already been reviewed.');
        }

        if (job.status !== 'Completed' && job.status !== 'Paid') {
            return response.badRequest(res, 'Only completed or paid jobs can be reviewed.');
        }

        job.rating = rating;
        job.reviewText = reviewText;
        job.reviewedAt = new Date();
        await job.save();

        // Update technician rating
        if (job.assignedTechnicianId) {
            const technician = await User.findById(job.assignedTechnicianId);
            if (technician) {
                const allJobs = await Job.find({ 
                    assignedTechnicianId: technician._id, 
                    rating: { $exists: true, $ne: null } 
                });
                
                const totalRating = allJobs.reduce((sum, j) => sum + j.rating, 0);
                technician.averageRating = allJobs.length > 0 ? totalRating / allJobs.length : 0;
                technician.ratingCount = allJobs.length;
                await technician.save();
            }
        }

        logger.info('USER', 'Review submitted', { jobId });
        return response.success(res, 'Review submitted successfully!');

    } catch (err) {
        logger.error('USER', 'Submit review error', err);
        return response.serverError(res, 'Internal server error during review submission.');
    }
};

/**
 * Get user announcements
 */
const getAnnouncements = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userCity = req.user.city;

        let queryConditions = [
            { targetAudience: 'All' },
            { targetAudience: userRole }
        ];

        if (userRole === 'Citymanager' && req.user.assignedCities?.length > 0) {
            queryConditions.push({ targetAudience: { $in: req.user.assignedCities } });
        }
        if (userRole === 'Serviceadmin' && req.user.skills?.length > 0) {
            queryConditions.push({ targetAudience: { $in: req.user.skills } });
        }
        if (userCity) {
            queryConditions.push({ targetAudience: userCity });
        }

        const announcements = await Announcement.find({
            $or: queryConditions
        }).sort({ publishedOn: -1 }).lean();

        return response.success(res, `Found ${announcements.length} announcements`, { announcements });

    } catch (err) {
        logger.error('USER', 'Get announcements error', err);
        return response.serverError(res, 'Internal server error while fetching announcements.');
    }
};

/**
 * Create support ticket
 */
const createTicket = async (req, res) => {
    logger.info('USER', 'Create ticket request', { userId: req.user._id });
    try {
        const { subject, description, serviceType } = req.body;

        if (!subject || !description) {
            return response.badRequest(res, 'Subject and description are required.');
        }

        const newTicket = new Ticket({
            ticketId: Ticket.generateTicketId(),
            raisedBy: req.user._id,
            subject,
            description,
            serviceType: serviceType || 'General',
            status: 'Open',
            priority: 'Medium'
        });

        await newTicket.save();

        logger.info('USER', 'Ticket created', { ticketId: newTicket.ticketId });
        return response.created(res, 'Support ticket submitted successfully!', { ticket: newTicket });

    } catch (err) {
        logger.error('USER', 'Create ticket error', err);
        return response.serverError(res, 'Internal server error during ticket submission.');
    }
};

module.exports = {
    getMe,
    updateProfile,
    uploadPhoto,
    updatePhone,
    bookService,
    getJobs,
    cancelJob,
    submitReview,
    getAnnouncements,
    createTicket
};
