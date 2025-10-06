"use strict";
/**
 * Backend API Client for EventConnect Extension
 * Handles communication with EventConnect server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const logger_1 = require("../shared/logger");
class ApiClient {
    constructor(baseUrl, authService) {
        this.baseUrl = baseUrl;
        this.authService = authService;
        /**
         * Authentication endpoints
         */
        this.auth = {
            validateToken: async () => {
                try {
                    await this.makeAuthenticatedRequest('/api/auth/validate');
                    return true;
                }
                catch (error) {
                    logger_1.Logger.warn('Token validation failed', error);
                    return false;
                }
            },
            getUserInfo: async () => {
                return await this.makeAuthenticatedRequest('/api/auth/user');
            }
        };
        /**
         * Event management endpoints
         */
        this.events = {
            getCurrentEvent: async () => {
                try {
                    return await this.makeAuthenticatedRequest('/api/events/current');
                }
                catch (error) {
                    if (error.message.includes('not found')) {
                        return null;
                    }
                    throw error;
                }
            },
            setCurrentEvent: async (eventId) => {
                await this.makeAuthenticatedRequest('/api/events/current', {
                    method: 'POST',
                    body: { eventId }
                });
            },
            validateEventSheet: async (sheetId) => {
                try {
                    const result = await this.makeAuthenticatedRequest('/api/events/validate-sheet', {
                        method: 'POST',
                        body: { sheetId }
                    });
                    return result.valid;
                }
                catch (error) {
                    logger_1.Logger.warn('Sheet validation failed', error);
                    return false;
                }
            }
        };
        /**
         * Google Sheets proxy endpoints (for complex operations)
         */
        this.sheets = {
            readEventData: async (sheetId) => {
                return await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/data`);
            },
            updateEventData: async (sheetId, data) => {
                await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/data`, {
                    method: 'PUT',
                    body: data
                });
            },
            appendEventLog: async (sheetId, entry) => {
                await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/log`, {
                    method: 'POST',
                    body: entry
                });
            }
        };
    }
    /**
     * Make authenticated request to backend API
     */
    async makeAuthenticatedRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        let lastError;
        for (let attempt = 1; attempt <= ApiClient.MAX_RETRIES; attempt++) {
            try {
                logger_1.Logger.debug(`API request attempt ${attempt}/${ApiClient.MAX_RETRIES}: ${options.method || 'GET'} ${url}`);
                const token = await this.authService.getValidToken();
                if (!token) {
                    throw new Error('No valid authentication token available');
                }
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                };
                const requestOptions = {
                    method: options.method || 'GET',
                    headers,
                    ...(options.body && { body: JSON.stringify(options.body) })
                };
                const response = await fetch(url, requestOptions);
                // Handle different response status codes
                if (response.status === 401) {
                    logger_1.Logger.warn('Authentication failed, token may be invalid');
                    throw new Error('Authentication failed. Please sign in again.');
                }
                if (response.status === 403) {
                    throw new Error('Access denied. You may not have permission for this operation.');
                }
                if (response.status === 404) {
                    throw new Error('Requested resource not found.');
                }
                if (response.status >= 500) {
                    throw new Error('Server error. Please try again later.');
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }
                const result = await response.json();
                logger_1.Logger.debug(`API request successful: ${options.method || 'GET'} ${url}`);
                return result;
            }
            catch (error) {
                lastError = error;
                logger_1.Logger.warn(`API request attempt ${attempt} failed:`, lastError);
                // Don't retry for authentication or client errors
                if (lastError.message.includes('Authentication failed') ||
                    lastError.message.includes('Access denied') ||
                    lastError.message.includes('not found')) {
                    break;
                }
                // Wait before retrying (exponential backoff)
                if (attempt < ApiClient.MAX_RETRIES) {
                    const delay = ApiClient.RETRY_DELAY * Math.pow(2, attempt - 1);
                    await this.sleep(delay);
                }
            }
        }
        logger_1.Logger.error(`API request failed after ${ApiClient.MAX_RETRIES} attempts`, lastError);
        throw lastError;
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get current base URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }
    /**
     * Update base URL (useful for environment switching)
     */
    setBaseUrl(url) {
        this.baseUrl = url;
        logger_1.Logger.info(`API base URL updated to: ${url}`);
    }
}
exports.ApiClient = ApiClient;
ApiClient.MAX_RETRIES = 3;
ApiClient.RETRY_DELAY = 1000; // 1 second base delay
//# sourceMappingURL=api-client.js.map