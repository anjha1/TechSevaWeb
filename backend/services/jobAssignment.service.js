/**
 * Smart Job Assignment Service
 * Like Zomato/Swiggy - Assigns jobs to nearest, highest-rated technicians
 * Features:
 * - Skill-based matching
 * - Rating-based priority
 * - Complaint penalty (-1 score)
 * - Nearest technician first
 * - Auto radius expansion (5km → 10km → 15km → 20km)
 * - 30-minute timeout before radius expansion
 */

const User = require('../models/User.model');
const Job = require('../models/Job.model');

// Constants
const INITIAL_RADIUS_KM = 5;
const RADIUS_INCREMENT_KM = 5;
const MAX_RADIUS_KM = 50;
const TIMEOUT_MINUTES = 30;
const TOP_TECHNICIANS_COUNT = 10;

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

// Calculate ETA based on distance (assuming 30 km/h average speed in city)
const calculateETA = (distanceKm) => {
    const avgSpeedKmH = 30; // Average speed in city traffic
    const timeHours = distanceKm / avgSpeedKmH;
    const timeMinutes = Math.ceil(timeHours * 60);
    return {
        minutes: timeMinutes,
        text: timeMinutes < 60 
            ? `${timeMinutes} mins` 
            : `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m`
    };
};

// Calculate technician score for job assignment
const calculateTechnicianScore = (technician, jobLocation, requiredSkills) => {
    let score = 0;
    
    // 1. Rating Score (0-50 points) - Higher rating = higher score
    const rating = technician.averageRating || 0;
    score += rating * 10; // Max 50 points for 5-star rating
    
    // 2. Skill Match Score (0-30 points)
    const techSkills = technician.skills || [];
    const matchedSkills = requiredSkills.filter(skill => 
        techSkills.some(ts => ts.toLowerCase().includes(skill.toLowerCase()))
    );
    score += (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 30;
    
    // 3. Experience/Jobs Completed Score (0-20 points)
    const completedJobs = technician.completedJobsCount || 0;
    score += Math.min(completedJobs / 10, 20); // Max 20 points for 200+ jobs
    
    // 4. Complaint Penalty (-1 per complaint)
    const complaints = technician.complaintsCount || 0;
    score -= complaints;
    
    // 5. Availability Bonus (+5 if currently available)
    if (technician.isAvailable && technician.isOnline) {
        score += 5;
    }
    
    // 6. Response Rate Bonus (0-10 points)
    const responseRate = technician.responseRate || 0.5;
    score += responseRate * 10;
    
    // 7. Distance Penalty (closer is better)
    if (technician.currentLocation && jobLocation) {
        const distance = calculateDistance(
            jobLocation.latitude,
            jobLocation.longitude,
            technician.currentLocation.latitude,
            technician.currentLocation.longitude
        );
        technician.distanceKm = distance;
        technician.eta = calculateETA(distance);
        // Penalize distance: -1 point per km
        score -= distance;
    }
    
    return Math.max(0, score); // Don't allow negative scores
};

// Find top technicians for a job within radius
const findTopTechniciansInRadius = async (job, radiusKm = INITIAL_RADIUS_KM) => {
    const jobLocation = job.location;
    
    if (!jobLocation?.latitude || !jobLocation?.longitude) {
        console.log('Job location not available, falling back to city-based search');
        // Fallback: Find technicians in same city
        const technicians = await User.find({
            role: 'technician',
            status: 'active',
            'workingLocation.city': jobLocation?.city,
            isAvailable: true
        }).select('+bankDetails').lean();
        return rankTechnicians(technicians, job);
    }
    
    // Find all active technicians
    const allTechnicians = await User.find({
        role: 'technician',
        status: 'active'
    }).lean();
    
    // Filter technicians within radius
    const techniciansInRadius = allTechnicians.filter(tech => {
        const techLocation = tech.currentLocation || tech.workingLocation;
        if (!techLocation?.latitude || !techLocation?.longitude) return false;
        
        const distance = calculateDistance(
            jobLocation.latitude,
            jobLocation.longitude,
            techLocation.latitude,
            techLocation.longitude
        );
        
        tech.distanceKm = distance;
        tech.eta = calculateETA(distance);
        
        return distance <= radiusKm;
    });
    
    return rankTechnicians(techniciansInRadius, job);
};

// Rank technicians by score
const rankTechnicians = (technicians, job) => {
    const requiredSkills = getRequiredSkills(job.applianceType);
    const jobLocation = job.location;
    
    // Calculate scores
    technicians.forEach(tech => {
        tech.assignmentScore = calculateTechnicianScore(tech, jobLocation, requiredSkills);
    });
    
    // Sort by score (highest first)
    technicians.sort((a, b) => b.assignmentScore - a.assignmentScore);
    
    // Return top N technicians
    return technicians.slice(0, TOP_TECHNICIANS_COUNT).map(tech => ({
        _id: tech._id,
        fullName: tech.fullName,
        phoneNumber: tech.phoneNumber,
        email: tech.email,
        profilePictureUrl: tech.profilePictureUrl,
        averageRating: tech.averageRating || 0,
        completedJobsCount: tech.completedJobsCount || 0,
        skills: tech.skills || [],
        distanceKm: tech.distanceKm || 0,
        eta: tech.eta || { minutes: 0, text: 'N/A' },
        assignmentScore: tech.assignmentScore,
        currentLocation: tech.currentLocation,
        isOnline: tech.isOnline || false
    }));
};

// Get required skills based on appliance type
const getRequiredSkills = (applianceType) => {
    const skillsMap = {
        'AC': ['AC', 'Air Conditioner', 'HVAC', 'Cooling'],
        'Air Conditioner': ['AC', 'Air Conditioner', 'HVAC', 'Cooling'],
        'Refrigerator': ['Refrigerator', 'Fridge', 'Cooling', 'Compressor'],
        'Washing Machine': ['Washing Machine', 'Washer', 'Laundry'],
        'TV': ['TV', 'Television', 'Display', 'Electronics'],
        'Microwave': ['Microwave', 'Oven', 'Kitchen Appliance'],
        'Fan': ['Fan', 'Motor', 'Electrical'],
        'Geyser': ['Geyser', 'Water Heater', 'Heating'],
        'Water Heater': ['Geyser', 'Water Heater', 'Heating'],
        'RO': ['RO', 'Water Purifier', 'Filter'],
        'Water Purifier': ['RO', 'Water Purifier', 'Filter']
    };
    
    return skillsMap[applianceType] || [applianceType];
};

// Main job assignment function
const assignJobToTechnicians = async (jobId) => {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    
    let currentRadius = INITIAL_RADIUS_KM;
    let topTechnicians = [];
    
    // Try to find technicians, expanding radius if needed
    while (currentRadius <= MAX_RADIUS_KM && topTechnicians.length === 0) {
        topTechnicians = await findTopTechniciansInRadius(job, currentRadius);
        
        if (topTechnicians.length === 0) {
            currentRadius += RADIUS_INCREMENT_KM;
            console.log(`No technicians found, expanding radius to ${currentRadius}km`);
        }
    }
    
    if (topTechnicians.length === 0) {
        throw new Error('No technicians available in your area');
    }
    
    // Update job with candidate technicians
    job.candidateTechnicians = topTechnicians.map(t => ({
        technicianId: t._id,
        notifiedAt: new Date(),
        status: 'pending',
        distanceKm: t.distanceKm,
        eta: t.eta
    }));
    job.currentRadius = currentRadius;
    job.radiusExpandedAt = new Date();
    await job.save();
    
    return {
        job,
        topTechnicians,
        currentRadius,
        message: `Job sent to ${topTechnicians.length} technicians within ${currentRadius}km`
    };
};

// Expand radius if no one accepts within timeout
const expandRadiusForJob = async (jobId) => {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    
    // Check if job is still pending
    if (job.status !== 'Pending') {
        return { expanded: false, message: 'Job already accepted or cancelled' };
    }
    
    // Check if timeout has passed
    const lastExpansion = job.radiusExpandedAt || job.createdAt;
    const timeSinceExpansion = (Date.now() - new Date(lastExpansion).getTime()) / (1000 * 60);
    
    if (timeSinceExpansion < TIMEOUT_MINUTES) {
        return { 
            expanded: false, 
            message: `Wait ${Math.ceil(TIMEOUT_MINUTES - timeSinceExpansion)} more minutes before expanding` 
        };
    }
    
    // Expand radius
    const newRadius = (job.currentRadius || INITIAL_RADIUS_KM) + RADIUS_INCREMENT_KM;
    
    if (newRadius > MAX_RADIUS_KM) {
        return { expanded: false, message: 'Maximum radius reached' };
    }
    
    // Find new technicians in expanded radius
    const topTechnicians = await findTopTechniciansInRadius(job, newRadius);
    
    // Filter out technicians who already rejected
    const rejectedIds = (job.candidateTechnicians || [])
        .filter(c => c.status === 'rejected')
        .map(c => c.technicianId.toString());
    
    const newTechnicians = topTechnicians.filter(t => 
        !rejectedIds.includes(t._id.toString())
    );
    
    // Update job
    job.currentRadius = newRadius;
    job.radiusExpandedAt = new Date();
    job.candidateTechnicians = [
        ...(job.candidateTechnicians || []).filter(c => c.status !== 'pending'),
        ...newTechnicians.map(t => ({
            technicianId: t._id,
            notifiedAt: new Date(),
            status: 'pending',
            distanceKm: t.distanceKm,
            eta: t.eta
        }))
    ];
    await job.save();
    
    return {
        expanded: true,
        newRadius,
        newTechnicians,
        message: `Radius expanded to ${newRadius}km, ${newTechnicians.length} new technicians notified`
    };
};

// Handle technician acceptance
const handleTechnicianAccept = async (jobId, technicianId) => {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    
    if (job.status !== 'Pending') {
        throw new Error('Job is no longer available');
    }
    
    // Assign technician
    job.assignedTechnicianId = technicianId;
    job.status = 'Accepted';
    job.acceptedAt = new Date();
    
    // Update candidate status
    job.candidateTechnicians = (job.candidateTechnicians || []).map(c => ({
        ...c,
        status: c.technicianId.toString() === technicianId.toString() ? 'accepted' : 'removed'
    }));
    
    await job.save();
    
    // Update technician's stats
    await User.findByIdAndUpdate(technicianId, {
        $inc: { activeJobsCount: 1 }
    });
    
    return job;
};

// Handle technician rejection
const handleTechnicianReject = async (jobId, technicianId) => {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    
    // Update candidate status
    job.candidateTechnicians = (job.candidateTechnicians || []).map(c => ({
        ...c,
        status: c.technicianId.toString() === technicianId.toString() ? 'rejected' : c.status
    }));
    
    // Update technician's rejection count (affects future assignments)
    await User.findByIdAndUpdate(technicianId, {
        $inc: { rejectionCount: 1 }
    });
    
    // Check if all candidates rejected
    const pendingCandidates = job.candidateTechnicians.filter(c => c.status === 'pending');
    if (pendingCandidates.length === 0) {
        // Auto expand radius
        const result = await expandRadiusForJob(jobId);
        return { job: await Job.findById(jobId), expanded: result.expanded, message: result.message };
    }
    
    await job.save();
    return { job };
};

// Update technician location (for real-time tracking)
const updateTechnicianLocation = async (technicianId, location) => {
    await User.findByIdAndUpdate(technicianId, {
        currentLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: new Date()
        },
        isOnline: true
    });
    
    // Find active jobs for this technician and update ETA
    const activeJobs = await Job.find({
        assignedTechnicianId: technicianId,
        status: { $in: ['Accepted', 'In Progress'] }
    });
    
    for (const job of activeJobs) {
        if (job.location?.latitude && job.location?.longitude) {
            const distance = calculateDistance(
                job.location.latitude,
                job.location.longitude,
                location.latitude,
                location.longitude
            );
            const eta = calculateETA(distance);
            
            job.technicianTracking = {
                currentLocation: location,
                distanceRemaining: distance,
                eta: eta,
                lastUpdated: new Date()
            };
            await job.save();
        }
    }
    
    return { success: true };
};

// Get tracking info for a job
const getJobTrackingInfo = async (jobId) => {
    const job = await Job.findById(jobId)
        .populate('assignedTechnicianId', 'fullName phoneNumber profilePictureUrl averageRating currentLocation');
    
    if (!job) throw new Error('Job not found');
    
    const technician = job.assignedTechnicianId;
    const techLocation = technician?.currentLocation;
    const jobLocation = job.location;
    
    let trackingInfo = {
        jobId: job.jobId,
        status: job.status,
        technician: technician ? {
            name: technician.fullName,
            phone: technician.phoneNumber,
            photo: technician.profilePictureUrl,
            rating: technician.averageRating
        } : null,
        userLocation: jobLocation ? {
            address: [jobLocation.houseBuilding, jobLocation.street, jobLocation.city, jobLocation.state, jobLocation.pincode].filter(Boolean).join(', '),
            latitude: jobLocation.latitude,
            longitude: jobLocation.longitude
        } : null,
        technicianLocation: null,
        distanceRemaining: null,
        eta: null,
        route: null
    };
    
    if (techLocation && jobLocation) {
        const distance = calculateDistance(
            jobLocation.latitude,
            jobLocation.longitude,
            techLocation.latitude,
            techLocation.longitude
        );
        const eta = calculateETA(distance);
        
        trackingInfo.technicianLocation = {
            latitude: techLocation.latitude,
            longitude: techLocation.longitude,
            lastUpdated: techLocation.updatedAt
        };
        trackingInfo.distanceRemaining = distance.toFixed(2);
        trackingInfo.eta = eta;
    }
    
    return trackingInfo;
};

module.exports = {
    calculateDistance,
    calculateETA,
    findTopTechniciansInRadius,
    assignJobToTechnicians,
    expandRadiusForJob,
    handleTechnicianAccept,
    handleTechnicianReject,
    updateTechnicianLocation,
    getJobTrackingInfo,
    INITIAL_RADIUS_KM,
    RADIUS_INCREMENT_KM,
    MAX_RADIUS_KM,
    TIMEOUT_MINUTES
};
