/**
 * PM2 Ecosystem Configuration
 * Production process management for TechSeva
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js
 */

module.exports = {
    apps: [
        {
            // =================================================================
            // Main Application
            // =================================================================
            name: 'techseva',
            script: './backend/server.js',
            instances: 'max',           // Use all CPU cores
            exec_mode: 'cluster',       // Enable clustering
            
            // Auto-restart settings
            watch: false,
            max_memory_restart: '500M',
            restart_delay: 4000,
            
            // Logging
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            merge_logs: true,
            
            // Environment variables
            env: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            
            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000,
            
            // Health monitoring
            exp_backoff_restart_delay: 100,
            max_restarts: 10,
            min_uptime: '10s',
            
            // Source maps for better error traces
            source_map_support: true
        },
        
        {
            // =================================================================
            // Legacy Server (Backup)
            // =================================================================
            name: 'techseva-legacy',
            script: './server.js',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            
            env: {
                NODE_ENV: 'development',
                PORT: 5001
            },
            
            // Disabled by default - enable if needed
            autorestart: false
        }
    ],
    
    // =========================================================================
    // Deployment Configuration
    // =========================================================================
    deploy: {
        production: {
            user: 'deploy',
            host: ['your-server.com'],
            ref: 'origin/main',
            repo: 'git@github.com:yourusername/techseva.git',
            path: '/var/www/techseva',
            
            'pre-deploy-local': '',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            
            env: {
                NODE_ENV: 'production'
            }
        },
        
        staging: {
            user: 'deploy',
            host: ['staging.your-server.com'],
            ref: 'origin/develop',
            repo: 'git@github.com:yourusername/techseva.git',
            path: '/var/www/techseva-staging',
            
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js',
            
            env: {
                NODE_ENV: 'staging'
            }
        }
    }
};
