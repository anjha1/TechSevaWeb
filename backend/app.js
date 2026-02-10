/**
 * Express Application Configuration
 * Sets up middleware, sessions, and route registration
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const config = require('./config/env');
const { registerRoutes } = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares');
const { logger } = require('./utils');

const app = express();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// CORS
app.use(cors({
    origin: config.corsOrigin || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// =============================================================================
// SESSION CONFIGURATION
// =============================================================================

app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: config.mongodbUri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
}));

// =============================================================================
// API ROUTES
// =============================================================================

registerRoutes(app);

// =============================================================================
// REACT SPA - Serve index.html for all frontend routes
// =============================================================================

const reactIndexPath = path.join(__dirname, '..', 'public', 'index.html');

// Serve React SPA for all non-API routes
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(reactIndexPath);
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// REQUEST LOGGING (Development)
// =============================================================================

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        logger.debug('HTTP', `${req.method} ${req.path}`, { 
            query: req.query, 
            body: req.method !== 'GET' ? '[body]' : undefined 
        });
        next();
    });
}

module.exports = app;
