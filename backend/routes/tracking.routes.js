/**
 * Tracking Routes
 * Real-time location tracking and job assignment endpoints
 */

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Technician routes
router.post('/technician/location', protect, authorize('technician'), trackingController.updateTechnicianLocation);
router.post('/technician/online-status', protect, authorize('technician'), trackingController.setTechnicianOnlineStatus);
router.get('/technician/active-job', protect, authorize('technician'), trackingController.getTechnicianActiveJob);
router.post('/technician/start-journey', protect, authorize('technician'), trackingController.startJourney);
router.post('/technician/arrived', protect, authorize('technician'), trackingController.markArrived);

// User routes
router.get('/job/:jobId', protect, trackingController.getJobTracking);
router.get('/job/:jobId/eta', protect, trackingController.getJobETA);

// Public routes (for preview)
router.get('/nearby-technicians', trackingController.getNearbyTechnicians);

// Admin routes
router.post('/job/:jobId/expand-radius', protect, authorize('Superadmin', 'ServiceAdmin'), trackingController.expandJobRadius);

module.exports = router;
