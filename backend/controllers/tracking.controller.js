/**
 * Tracking Controller
 * Real-time location tracking and job assignment APIs
 */

const jobAssignmentService = require('../services/jobAssignment.service');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');

// Update technician location (called frequently by technician app)
exports.updateTechnicianLocation = async (req, res) => {
    try {
        const technicianId = req.user._id;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }

        await jobAssignmentService.updateTechnicianLocation(technicianId, { latitude, longitude });

        return successResponse(res, { message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        return errorResponse(res, error.message);
    }
};

// Get job tracking info (for user to see technician location)
exports.getJobTracking = async (req, res) => {
    try {
        const { jobId } = req.params;

        const trackingInfo = await jobAssignmentService.getJobTrackingInfo(jobId);

        return successResponse(res, { tracking: trackingInfo });
    } catch (error) {
        console.error('Get tracking error:', error);
        return errorResponse(res, error.message);
    }
};

// Manually trigger radius expansion (admin or system)
exports.expandJobRadius = async (req, res) => {
    try {
        const { jobId } = req.params;

        const result = await jobAssignmentService.expandRadiusForJob(jobId);

        return successResponse(res, result);
    } catch (error) {
        console.error('Expand radius error:', error);
        return errorResponse(res, error.message);
    }
};

// Get nearby technicians for a location (preview before booking)
exports.getNearbyTechnicians = async (req, res) => {
    try {
        const { latitude, longitude, applianceType, radiusKm = 10 } = req.query;

        if (!latitude || !longitude) {
            return errorResponse(res, 'Location is required', 400);
        }

        // Create a mock job object for the search
        const mockJob = {
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            applianceType: applianceType || 'General'
        };

        const technicians = await jobAssignmentService.findTopTechniciansInRadius(mockJob, parseFloat(radiusKm));

        return successResponse(res, {
            technicians,
            count: technicians.length,
            radiusKm: parseFloat(radiusKm)
        });
    } catch (error) {
        console.error('Get nearby technicians error:', error);
        return errorResponse(res, error.message);
    }
};

// Set technician online/offline status
exports.setTechnicianOnlineStatus = async (req, res) => {
    try {
        const technicianId = req.user._id;
        const { isOnline } = req.body;

        await User.findByIdAndUpdate(technicianId, {
            isOnline: isOnline,
            lastOnlineAt: new Date()
        });

        return successResponse(res, { message: `Status set to ${isOnline ? 'online' : 'offline'}` });
    } catch (error) {
        console.error('Set online status error:', error);
        return errorResponse(res, error.message);
    }
};

// Get technician's active job with tracking
exports.getTechnicianActiveJob = async (req, res) => {
    try {
        const technicianId = req.user._id;

        const activeJob = await Job.findOne({
            assignedTechnicianId: technicianId,
            status: { $in: ['Accepted', 'In Progress', 'Diagnosed'] }
        }).populate('customerId', 'fullName phoneNumber address');

        if (!activeJob) {
            return successResponse(res, { activeJob: null });
        }

        // Calculate distance and ETA from technician's current location
        const technician = await User.findById(technicianId);
        const techLocation = technician?.currentLocation;
        const jobLocation = activeJob.location;

        let trackingInfo = null;
        if (techLocation && jobLocation?.latitude && jobLocation?.longitude) {
            const distance = jobAssignmentService.calculateDistance(
                jobLocation.latitude,
                jobLocation.longitude,
                techLocation.latitude,
                techLocation.longitude
            );
            const eta = jobAssignmentService.calculateETA(distance);

            trackingInfo = {
                distanceRemaining: distance.toFixed(2),
                eta: eta,
                userLocation: {
                    latitude: jobLocation.latitude,
                    longitude: jobLocation.longitude,
                    address: [jobLocation.houseBuilding, jobLocation.street, jobLocation.city, jobLocation.state, jobLocation.pincode].filter(Boolean).join(', ')
                },
                technicianLocation: {
                    latitude: techLocation.latitude,
                    longitude: techLocation.longitude
                }
            };
        }

        return successResponse(res, {
            activeJob: {
                ...activeJob.toObject(),
                tracking: trackingInfo
            }
        });
    } catch (error) {
        console.error('Get active job error:', error);
        return errorResponse(res, error.message);
    }
};

// Start journey to customer (technician)
exports.startJourney = async (req, res) => {
    try {
        const technicianId = req.user._id;
        const { jobId, latitude, longitude } = req.body;

        const job = await Job.findOne({ jobId, assignedTechnicianId: technicianId });
        if (!job) {
            return errorResponse(res, 'Job not found', 404);
        }

        // Update job status
        job.status = 'In Progress';
        job.trackingStatus = 'onway';
        job.journeyStartedAt = new Date();

        // Set initial tracking
        if (latitude && longitude) {
            const jobLocation = job.location;
            if (jobLocation?.latitude && jobLocation?.longitude) {
                const distance = jobAssignmentService.calculateDistance(
                    jobLocation.latitude,
                    jobLocation.longitude,
                    latitude,
                    longitude
                );
                const eta = jobAssignmentService.calculateETA(distance);

                job.technicianTracking = {
                    currentLocation: { latitude, longitude },
                    distanceRemaining: distance,
                    eta: eta,
                    lastUpdated: new Date()
                };
            }
        }

        await job.save();

        // Update technician location
        if (latitude && longitude) {
            await jobAssignmentService.updateTechnicianLocation(technicianId, { latitude, longitude });
        }

        return successResponse(res, {
            message: 'Journey started',
            job: job,
            tracking: job.technicianTracking
        });
    } catch (error) {
        console.error('Start journey error:', error);
        return errorResponse(res, error.message);
    }
};

// Mark arrived at location
exports.markArrived = async (req, res) => {
    try {
        const technicianId = req.user._id;
        const { jobId } = req.body;

        const job = await Job.findOne({ jobId, assignedTechnicianId: technicianId });
        if (!job) {
            return errorResponse(res, 'Job not found', 404);
        }

        job.trackingStatus = 'arrived';
        job.arrivedAt = new Date();
        job.technicianTracking = {
            ...job.technicianTracking,
            distanceRemaining: 0,
            eta: { minutes: 0, text: 'Arrived' },
            lastUpdated: new Date()
        };

        await job.save();

        return successResponse(res, {
            message: 'Marked as arrived',
            job: job
        });
    } catch (error) {
        console.error('Mark arrived error:', error);
        return errorResponse(res, error.message);
    }
};

// Get ETA for a specific job
exports.getJobETA = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findOne({ jobId })
            .populate('assignedTechnicianId', 'fullName currentLocation');

        if (!job) {
            return errorResponse(res, 'Job not found', 404);
        }

        const technician = job.assignedTechnicianId;
        const techLocation = technician?.currentLocation;
        const jobLocation = job.location;

        if (!techLocation || !jobLocation?.latitude || !jobLocation?.longitude) {
            return successResponse(res, {
                eta: null,
                message: 'Location data not available'
            });
        }

        const distance = jobAssignmentService.calculateDistance(
            jobLocation.latitude,
            jobLocation.longitude,
            techLocation.latitude,
            techLocation.longitude
        );
        const eta = jobAssignmentService.calculateETA(distance);

        return successResponse(res, {
            eta: eta,
            distanceKm: distance.toFixed(2),
            technicianName: technician.fullName,
            lastUpdated: techLocation.updatedAt
        });
    } catch (error) {
        console.error('Get ETA error:', error);
        return errorResponse(res, error.message);
    }
};
