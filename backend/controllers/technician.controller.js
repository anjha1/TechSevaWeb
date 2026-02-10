/**
 * Technician Controller
 * Handles technician-specific operations: jobs, diagnosis, availability, payments
 */

const mongoose = require('mongoose');
const { User, Job, Transaction } = require('../models');
const { response, logger } = require('../utils');
const { processTechnicianPayout } = require('../services/payment.service');
const config = require('../config/env');

/**
 * Get technician's assigned jobs
 */
const getJobs = async (req, res) => {
    try {
        const technicianId = new mongoose.Types.ObjectId(req.session.user.id);
        
        const jobs = await Job.find({ assignedTechnicianId: technicianId })
            .populate('userId', 'fullName email phoneNumber')
            .lean();
            
        return response.success(res, `Found ${jobs.length} jobs`, { jobs });
        
    } catch (err) {
        logger.error('TECHNICIAN', 'Get jobs error', err);
        return response.serverError(res, 'Internal server error while fetching jobs.');
    }
};

/**
 * Accept a job
 */
const acceptJob = async (req, res) => {
    logger.info('TECHNICIAN', 'Accept job request', { jobId: req.body.jobId });
    try {
        const { jobId } = req.body;
        const technicianId = new mongoose.Types.ObjectId(req.user._id);
        const technicianName = req.user.fullName;

        const job = await Job.findOneAndUpdate(
            {
                jobId,
                status: 'Pending',
                $or: [
                    { assignedTechnicianId: null },
                    { assignedTechnicianId: technicianId }
                ]
            },
            { 
                $set: { 
                    assignedTechnicianId: technicianId, 
                    assignedTechnicianName: technicianName, 
                    status: 'Accepted' 
                } 
            },
            { new: true }
        ).lean();

        if (!job) {
            return response.notFound(res, 'Job not found, not pending, or already assigned.');
        }

        logger.info('TECHNICIAN', 'Job accepted', { jobId });
        return response.success(res, 'Job accepted successfully!', { job });

    } catch (err) {
        logger.error('TECHNICIAN', 'Accept job error', err);
        return response.serverError(res, 'Internal server error during job acceptance.');
    }
};

/**
 * Start a job
 */
const startJob = async (req, res) => {
    logger.info('TECHNICIAN', 'Start job request', { jobId: req.body.jobId });
    try {
        const { jobId } = req.body;
        const technicianId = new mongoose.Types.ObjectId(req.user._id);

        const job = await Job.findOneAndUpdate(
            { jobId, assignedTechnicianId: technicianId, status: 'Accepted' },
            { $set: { status: 'In Progress' } },
            { new: true }
        ).lean();

        if (!job) {
            return response.notFound(res, 'Job not found or not in Accepted status.');
        }

        logger.info('TECHNICIAN', 'Job started', { jobId });
        return response.success(res, 'Job started!', { job });

    } catch (err) {
        logger.error('TECHNICIAN', 'Start job error', err);
        return response.serverError(res, 'Internal server error during job start.');
    }
};

/**
 * Complete a job with proof images
 */
const completeJob = async (req, res) => {
    logger.info('TECHNICIAN', 'Complete job request', { jobId: req.body.jobId });
    try {
        const { jobId } = req.body;
        const technicianId = req.user._id;
        
        // Convert uploaded files to Base64
        const proofImages = req.files 
            ? req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`) 
            : [];

        const job = await Job.findOneAndUpdate(
            { 
                jobId, 
                assignedTechnicianId: technicianId, 
                status: { $in: ['In Progress', 'Diagnosed'] } 
            },
            {
                $set: {
                    status: 'Completed',
                    completedAt: new Date(),
                    proofImages
                }
            },
            { new: true }
        );

        if (!job) {
            return response.notFound(res, 'Job not found or not in correct status.');
        }

        logger.info('TECHNICIAN', 'Job completed', { jobId });
        return response.success(res, 'Job marked as Completed!', { job: job.toJSON() });

    } catch (err) {
        logger.error('TECHNICIAN', 'Complete job error', err);
        return response.serverError(res, 'Internal server error during job completion.');
    }
};

/**
 * Reject a job
 */
const rejectJob = async (req, res) => {
    logger.info('TECHNICIAN', 'Reject job request', { jobId: req.body.jobId });
    try {
        const { jobId } = req.body;
        const technicianId = new mongoose.Types.ObjectId(req.user._id);

        const job = await Job.findOneAndUpdate(
            { jobId, assignedTechnicianId: technicianId, status: 'Pending' },
            { $set: { status: 'Cancelled' } },
            { new: true }
        ).lean();

        if (!job) {
            return response.notFound(res, 'Job not found or cannot be rejected.');
        }

        logger.info('TECHNICIAN', 'Job rejected', { jobId });
        return response.success(res, 'Job rejected successfully!');

    } catch (err) {
        logger.error('TECHNICIAN', 'Reject job error', err);
        return response.serverError(res, 'Internal server error during job rejection.');
    }
};

/**
 * Submit diagnosis and quotation
 */
const submitDiagnosis = async (req, res) => {
    logger.info('TECHNICIAN', 'Submit diagnosis request', { jobId: req.body.jobId });
    try {
        const { jobId, faultyParts, technicianRemarks, partCost, laborCost, travelCharges, totalEstimate } = req.body;
        const technicianId = new mongoose.Types.ObjectId(req.user._id);

        // Handle proof images
        const proofImages = req.files 
            ? req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`) 
            : [];

        // Parse faulty parts
        let parsedFaultyParts = [];
        if (faultyParts) {
            if (typeof faultyParts === 'string') {
                try {
                    parsedFaultyParts = JSON.parse(faultyParts);
                } catch {
                    parsedFaultyParts = faultyParts.split(',').map(p => p.trim()).filter(Boolean);
                }
            } else if (Array.isArray(faultyParts)) {
                parsedFaultyParts = faultyParts;
            }
        }

        const job = await Job.findOneAndUpdate(
            { jobId, assignedTechnicianId: technicianId, status: { $in: ['In Progress', 'Accepted'] } },
            {
                $set: {
                    faultyParts: parsedFaultyParts,
                    technicianRemarks,
                    quotation: {
                        partCost: parseFloat(partCost),
                        laborCost: parseFloat(laborCost),
                        travelCharges: parseFloat(travelCharges),
                        totalEstimate: parseFloat(totalEstimate),
                        createdAt: new Date()
                    },
                    status: 'Diagnosed',
                    proofImages
                }
            },
            { new: true }
        ).lean();

        if (!job) {
            return response.notFound(res, 'Job not found or not in correct status.');
        }

        logger.info('TECHNICIAN', 'Diagnosis submitted', { jobId });
        return response.success(res, 'Diagnosis & Quotation saved successfully.', { job });

    } catch (err) {
        logger.error('TECHNICIAN', 'Submit diagnosis error', err);
        return response.serverError(res, 'Internal server error during diagnosis submission.');
    }
};

/**
 * Update availability settings
 */
const updateAvailability = async (req, res) => {
    logger.info('TECHNICIAN', 'Update availability request', { userId: req.user._id });
    try {
        const { availableDays, startTime, endTime, emergencyCalls } = req.body;

        const technician = await User.findById(req.user._id);
        if (!technician) {
            return response.notFound(res, 'Technician not found.');
        }

        technician.availability = {
            availableDays: availableDays || [],
            startTime: startTime || '09:00',
            endTime: endTime || '18:00',
            emergencyCalls: emergencyCalls !== undefined ? emergencyCalls : false
        };
        
        await technician.save();

        logger.info('TECHNICIAN', 'Availability updated', { userId: req.user._id });
        return response.success(res, 'Availability updated successfully!');

    } catch (error) {
        logger.error('TECHNICIAN', 'Update availability error', error);
        return response.serverError(res, 'Internal server error updating availability.');
    }
};

/**
 * Update working location
 */
const updateLocation = async (req, res) => {
    logger.info('TECHNICIAN', 'Update location request', { userId: req.user._id });
    try {
        const { workingLocation } = req.body;

        const technician = await User.findById(req.user._id);
        if (!technician) {
            return response.notFound(res, 'Technician not found.');
        }

        // Geocoding via Google Maps API (if configured)
        let geocodedLat = null;
        let geocodedLng = null;

        if (config.google.mapsApiKey && workingLocation) {
            const addressParts = [
                workingLocation.houseBuilding,
                workingLocation.street,
                workingLocation.city,
                workingLocation.state,
                workingLocation.pincode,
                'India'
            ].filter(Boolean);
            const fullAddress = addressParts.join(', ');

            try {
                const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${config.google.mapsApiKey}`;
                const response = await fetch(geocodingUrl);
                const data = await response.json();

                if (data.status === 'OK' && data.results?.length > 0) {
                    const location = data.results[0].geometry.location;
                    geocodedLat = location.lat;
                    geocodedLng = location.lng;
                }
            } catch (geocodeError) {
                logger.warn('TECHNICIAN', 'Geocoding failed', geocodeError);
            }
        }

        technician.workingLocation = {
            pincode: workingLocation.pincode || '',
            city: workingLocation.city || '',
            state: workingLocation.state || '',
            street: workingLocation.street || '',
            houseBuilding: workingLocation.houseBuilding || '',
            radiusKm: workingLocation.radiusKm || 10,
            latitude: geocodedLat ?? parseFloat(workingLocation.latitude) ?? null,
            longitude: geocodedLng ?? parseFloat(workingLocation.longitude) ?? null
        };

        await technician.save();

        logger.info('TECHNICIAN', 'Location updated', { userId: req.user._id });
        return response.success(res, 'Location settings updated successfully!');

    } catch (error) {
        logger.error('TECHNICIAN', 'Update location error', error);
        return response.serverError(res, 'Internal server error updating location.');
    }
};

/**
 * Update payment/bank details
 */
const updatePaymentDetails = async (req, res) => {
    logger.info('TECHNICIAN', 'Update payment details request', { userId: req.user._id });
    try {
        const { bankName, accountNumber, ifscCode, upiId } = req.body;

        const technician = await User.findById(req.user._id);
        if (!technician) {
            return response.notFound(res, 'Technician not found.');
        }

        technician.bankDetails = {
            bankName: bankName || '',
            accountNumber: accountNumber || '',
            ifscCode: ifscCode || '',
            upiId: upiId || ''
        };

        await technician.save();

        logger.info('TECHNICIAN', 'Payment details updated', { userId: req.user._id });
        return response.success(res, 'Payment details updated successfully!');

    } catch (error) {
        logger.error('TECHNICIAN', 'Update payment details error', error);
        return response.serverError(res, 'Internal server error updating payment details.');
    }
};

/**
 * Request withdrawal
 */
const withdraw = async (req, res) => {
    logger.info('TECHNICIAN', 'Withdrawal request', { userId: req.user._id, amount: req.body.amount });
    try {
        const { amount, technicianId: targetTechnicianId } = req.body;
        const userId = req.user._id;

        // Determine target technician (self or specified by finance officer)
        const actualTechnicianId = req.user.role === 'technician' ? userId : targetTechnicianId;

        if (!actualTechnicianId) {
            return response.badRequest(res, 'Technician ID is required.');
        }

        if (amount <= 0) {
            return response.badRequest(res, 'Withdrawal amount must be positive.');
        }

        const result = await processTechnicianPayout({
            technicianId: actualTechnicianId,
            amount,
            processedBy: userId
        });

        if (result.success) {
            return response.success(res, result.message);
        }
        
        return response.badRequest(res, result.message);

    } catch (error) {
        logger.error('TECHNICIAN', 'Withdrawal error', error);
        return response.serverError(res, 'Internal server error during withdrawal.');
    }
};

module.exports = {
    getJobs,
    acceptJob,
    startJob,
    completeJob,
    rejectJob,
    submitDiagnosis,
    updateAvailability,
    updateLocation,
    updatePaymentDetails,
    withdraw
};
