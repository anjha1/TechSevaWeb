/**
 * User Routes
 * Customer-specific routes: profile, bookings, jobs
 */

const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { isAuthenticated, loadUser, isUser } = require('../middlewares');

// All user routes require authentication
router.use(isAuthenticated);
router.use(loadUser);

// Profile
router.get('/me', userController.getMe);
router.put('/profile', userController.updateProfile);
router.post('/profile/photo', userController.uploadPhoto);
router.put('/phone', userController.updatePhone);

// Jobs & Bookings
router.post('/book', isUser, userController.bookService);
router.get('/jobs', userController.getJobs);
router.post('/jobs/cancel', isUser, userController.cancelJob);
router.post('/jobs/review', isUser, userController.submitReview);

// Announcements
router.get('/announcements', userController.getAnnouncements);

// Support
router.post('/tickets', userController.createTicket);

module.exports = router;
