/**
 * Routes Index
 * Central export and registration of all route modules
 */

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const technicianRoutes = require('./technician.routes');
const adminRoutes = require('./admin.routes');
const contactRoutes = require('./contact.routes');
const paymentRoutes = require('./payment.routes');
const trackingRoutes = require('./tracking.routes');

/**
 * Register all routes with the Express app
 * @param {Express.Application} app - Express application instance
 */
const registerRoutes = (app) => {
    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.status(200).json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
    
    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/technician', technicianRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api', paymentRoutes);
    app.use('/api/tracking', trackingRoutes);
};

module.exports = {
    authRoutes,
    userRoutes,
    technicianRoutes,
    adminRoutes,
    contactRoutes,
    paymentRoutes,
    trackingRoutes,
    registerRoutes
};
