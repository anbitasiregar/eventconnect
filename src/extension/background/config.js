"use strict";
/**
 * Environment Configuration for EventConnect Extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
exports.getEnvironmentSettings = getEnvironmentSettings;
exports.updateConfig = updateConfig;
const logger_1 = require("../shared/logger");
/**
 * Get configuration based on environment
 */
function createConfig() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
        apiBaseUrl: isDevelopment
            ? 'http://localhost:3000'
            : 'https://api.eventconnect.app',
        googleClientId: process.env.GOOGLE_CLIENT_ID || '554258518238-9fs00eer4665qggru39lfmi4o6jrq42n.apps.googleusercontent.com',
        isDevelopment,
        logLevel: isDevelopment ? 'debug' : 'info',
        features: {
            enableAnalytics: !isDevelopment,
            enableDebugMode: isDevelopment,
            enableCaching: true
        },
        limits: {
            maxRetries: 3,
            requestTimeout: isDevelopment ? 10000 : 5000, // 10s dev, 5s prod
            cacheTimeout: 5 * 60 * 1000 // 5 minutes
        }
    };
}
exports.config = createConfig();
/**
 * Validate configuration on startup
 */
function validateConfig() {
    const errors = [];
    if (!exports.config.apiBaseUrl) {
        errors.push('API base URL is not configured');
    }
    if (!exports.config.googleClientId || exports.config.googleClientId === '554258518238-9fs00eer4665qggru39lfmi4o6jrq42n.apps.googleusercontent.com') {
        errors.push('Google Client ID is not configured');
    }
    if (errors.length > 0) {
        logger_1.Logger.error('Configuration validation failed:', new Error(errors.join(', ')));
        return false;
    }
    logger_1.Logger.info('Configuration validated successfully', {
        apiBaseUrl: exports.config.apiBaseUrl,
        isDevelopment: exports.config.isDevelopment,
        features: exports.config.features
    });
    return true;
}
/**
 * Get environment-specific settings
 */
function getEnvironmentSettings() {
    return {
        isDevelopment: exports.config.isDevelopment,
        apiBaseUrl: exports.config.apiBaseUrl,
        features: exports.config.features,
        limits: exports.config.limits
    };
}
/**
 * Update configuration at runtime (for testing)
 */
function updateConfig(updates) {
    Object.assign(exports.config, updates);
    logger_1.Logger.info('Configuration updated', updates);
}
//# sourceMappingURL=config.js.map