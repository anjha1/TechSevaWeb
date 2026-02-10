/**
 * Logger Utility
 * Centralized logging with different levels
 */

const config = require('../config/env');

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLevel = config.nodeEnv === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

const formatMessage = (level, context, message, data) => {
    const timestamp = new Date().toISOString();
    const levelTag = `[${level}]`;
    const contextTag = context ? `[${context}]` : '';
    return { timestamp, levelTag, contextTag, message, data };
};

const logger = {
    error: (context, message, data = null) => {
        if (currentLevel >= LOG_LEVELS.ERROR) {
            const log = formatMessage('ERROR', context, message, data);
            console.error(`${log.timestamp} ${log.levelTag}${log.contextTag} ${log.message}`, data || '');
        }
    },
    
    warn: (context, message, data = null) => {
        if (currentLevel >= LOG_LEVELS.WARN) {
            const log = formatMessage('WARN', context, message, data);
            console.warn(`${log.timestamp} ${log.levelTag}${log.contextTag} ${log.message}`, data || '');
        }
    },
    
    info: (context, message, data = null) => {
        if (currentLevel >= LOG_LEVELS.INFO) {
            const log = formatMessage('INFO', context, message, data);
            console.log(`${log.timestamp} ${log.levelTag}${log.contextTag} ${log.message}`, data || '');
        }
    },
    
    debug: (context, message, data = null) => {
        if (currentLevel >= LOG_LEVELS.DEBUG) {
            const log = formatMessage('DEBUG', context, message, data);
            console.log(`${log.timestamp} ${log.levelTag}${log.contextTag} ${log.message}`, data || '');
        }
    },
    
    // Request logging
    request: (req) => {
        if (currentLevel >= LOG_LEVELS.DEBUG) {
            console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.path} - User: ${req.user?.email || 'anonymous'}`);
        }
    }
};

module.exports = logger;
