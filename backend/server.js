/**
 * TechSeva Server Entry Point
 * Minimal entry file that starts the Express application
 */

const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { logger } = require('./utils');

const PORT = config.port;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start Express server
        app.listen(PORT, () => {
            logger.info('SERVER', `TechSeva running on http://localhost:${PORT}`);
            logger.info('SERVER', `Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('SERVER', 'Failed to start server', error);
        process.exit(1);
    }
};

startServer();
