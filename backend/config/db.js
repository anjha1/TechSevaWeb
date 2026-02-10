/**
 * MongoDB Database Connection
 * Handles connection, event listeners, and graceful shutdown
 */

const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongodbUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected successfully!');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to DB!');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  Mongoose disconnected from DB.');
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    await mongoose.connection.close();
    console.log('MongoDB connection closed. Exiting process.');
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { connectDB, mongoose };
