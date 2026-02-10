/**
 * Admin Routes
 * Admin operations: users, jobs, settings, reports
 */

const express = require('express');
const router = express.Router();
const { adminController } = require('../controllers');
const { 
    isAuthenticated, 
    loadUser, 
    isAdmin, 
    authorizeRoles 
} = require('../middlewares');

// All admin routes require authentication + admin role
router.use(isAuthenticated);
router.use(loadUser);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardOverview);

// Users Management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/:userId/reset-password', authorizeRoles('Superadmin'), adminController.resetUserPassword);
router.post('/users/admin', authorizeRoles('Superadmin'), adminController.createAdminUser);

// KYC Management
router.post('/kyc/approve/:userId', adminController.approveTechnicianKYC);
router.post('/kyc/reject/:userId', adminController.rejectTechnicianKYC);

// Jobs Management
router.get('/jobs', adminController.getJobs);
router.post('/jobs/assign', adminController.assignTechnician);

// Appliance Types
router.get('/appliances', adminController.getApplianceTypes);
router.post('/appliances', authorizeRoles('Superadmin', 'Serviceadmin'), adminController.createApplianceType);
router.put('/appliances/:id', authorizeRoles('Superadmin', 'Serviceadmin'), adminController.updateApplianceType);
router.delete('/appliances/:id', authorizeRoles('Superadmin'), adminController.deleteApplianceType);

// Locations
router.get('/locations', adminController.getLocations);
router.post('/locations', authorizeRoles('Superadmin', 'Citymanager'), adminController.createLocation);
router.put('/locations/:id', authorizeRoles('Superadmin', 'Citymanager'), adminController.updateLocation);
router.delete('/locations/:id', authorizeRoles('Superadmin'), adminController.deleteLocation);

// Tickets
router.get('/tickets', adminController.getTickets);
router.put('/tickets/:ticketId/assign', adminController.assignTicket);
router.put('/tickets/:ticketId/resolve', adminController.resolveTicket);
router.put('/tickets/:ticketId/close', adminController.closeTicket);

// Financial
router.get('/transactions', authorizeRoles('Superadmin', 'Financeofficer'), adminController.getTransactions);

// Contact Messages
router.get('/contact-messages', adminController.getContactMessages);
router.delete('/contact-messages/:id', adminController.deleteContactMessage);

module.exports = router;
