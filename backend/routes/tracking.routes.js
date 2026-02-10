/**
 * Tracking Routes
 * Real-time location tracking and job assignment endpoints
 */

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/tracking.controller');
const { isAuthenticated, authorizeRoles } = require('../middlewares/auth.middleware');

// Technician routes
router.post('/technician/location', isAuthenticated, authorizeRoles(['technician']), trackingController.updateTechnicianLocation);
router.post('/technician/online-status', isAuthenticated, authorizeRoles(['technician']), trackingController.setTechnicianOnlineStatus);
router.get('/technician/active-job', isAuthenticated, authorizeRoles(['technician']), trackingController.getTechnicianActiveJob);
router.post('/technician/start-journey', isAuthenticated, authorizeRoles(['technician']), trackingController.startJourney);
router.post('/technician/arrived', isAuthenticated, authorizeRoles(['technician']), trackingController.markArrived);

// User routes
router.get('/job/:jobId', isAuthenticated, trackingController.getJobTracking);
router.get('/job/:jobId/eta', isAuthenticated, trackingController.getJobETA);

// Public routes (for preview)
router.get('/nearby-technicians', trackingController.getNearbyTechnicians);

// Admin routes
router.post('/job/:jobId/expand-radius', isAuthenticated, authorizeRoles(['Superadmin', 'ServiceAdmin']), trackingController.expandJobRadius);

module.exports = router;
