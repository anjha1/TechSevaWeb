/**
 * Technician Routes
 * Technician-specific routes: jobs, diagnosis, settings
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { technicianController } = require('../controllers');
const { isAuthenticated, loadUser, isTechnician } = require('../middlewares');

// Multer config for job proof images
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// All technician routes require authentication + technician role
router.use(isAuthenticated);
router.use(loadUser);
router.use(isTechnician);

// Jobs
router.get('/jobs', technicianController.getJobs);
router.post('/jobs/accept', technicianController.acceptJob);
router.post('/jobs/start', technicianController.startJob);
router.post('/jobs/complete', upload.array('proofImages', 5), technicianController.completeJob);
router.post('/jobs/reject', technicianController.rejectJob);
router.post('/jobs/diagnosis', upload.array('proofImages', 5), technicianController.submitDiagnosis);

// Settings
router.put('/availability', technicianController.updateAvailability);
router.put('/location', technicianController.updateLocation);
router.put('/payment-details', technicianController.updatePaymentDetails);

// Payments
router.post('/withdraw', technicianController.withdraw);

module.exports = router;
