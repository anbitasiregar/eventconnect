"use strict";
/**
 * EventConnect Extension Service Worker
 * Enhanced with full authentication, API communication, and Google Sheets integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_1 = require("./google-auth");
const api_client_1 = require("./api-client");
const sheets_service_1 = require("./sheets-service");
const message_handler_1 = require("./message-handler");
const config_1 = require("./config");
const logger_1 = require("../shared/logger");
const storage_1 = require("../shared/storage");
// Initialize services
let authService;
let apiClient;
let sheetsService;
let messageHandler;
// Service worker installation
chrome.runtime.onInstalled.addListener(async (details) => {
    try {
        // Initialize logging first
        (0, logger_1.initializeLogger)();
        logger_1.Logger.info('EventConnect extension installed', { reason: details.reason });
        // Validate configuration
        if (!(0, config_1.validateConfig)()) {
            throw new Error('Configuration validation failed');
        }
        // Initialize services
        await initializeServices();
        if (details.reason === 'install') {
            // First-time installation
            await initializeExtension();
            await openOnboardingFlow();
        }
        else if (details.reason === 'update') {
            // Extension update
            await migrateStorageIfNeeded();
        }
        logger_1.Logger.info('Extension initialization completed successfully');
    }
    catch (error) {
        logger_1.Logger.error('Extension initialization failed', error);
    }
});
// Service worker startup
chrome.runtime.onStartup.addListener(async () => {
    try {
        logger_1.Logger.info('EventConnect extension started');
        // Initialize services if not already done
        if (!authService) {
            await initializeServices();
        }
        // Validate authentication state
        await validateAuthenticationState();
        // Refresh current event context
        await refreshCurrentEventContext();
        logger_1.Logger.info('Extension startup completed');
    }
    catch (error) {
        logger_1.Logger.error('Extension startup failed', error);
    }
});
// Message routing with enhanced handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger_1.Logger.info('Message received', { message, sender });
    handleAsyncMessage(message, sender)
        .then(sendResponse)
        .catch(error => {
        logger_1.Logger.error('Message handling error', error, {
            messageType: message.type,
            requestId: message.requestId
        });
        sendResponse({ error: error.message });
    });
    return true; // Keep message channel open for async response
});
async function handleAsyncMessage(message, sender) {
    // Ensure services are initialized
    if (!messageHandler) {
        await initializeServices();
    }
    return await messageHandler.handleMessage(message, sender);
}
/**
 * Initialize all extension services
 */
async function initializeServices() {
    try {
        logger_1.Logger.info('Initializing extension services');
        // Initialize authentication service
        authService = new google_auth_1.GoogleAuthService();
        // Initialize API client
        apiClient = new api_client_1.ApiClient(config_1.config.apiBaseUrl, authService);
        // Initialize Google Sheets service
        sheetsService = new sheets_service_1.GoogleSheetsService(() => authService.getValidToken());
        // Initialize message handler
        messageHandler = new message_handler_1.MessageHandler(authService, apiClient, sheetsService);
        logger_1.Logger.info('All services initialized successfully');
    }
    catch (error) {
        logger_1.Logger.error('Failed to initialize services', error);
        throw error;
    }
}
/**
 * Initialize extension on first install
 */
async function initializeExtension() {
    try {
        logger_1.Logger.info('Performing first-time extension initialization');
        // Set default preferences
        const preferences = await (0, storage_1.getStorageItem)('basicPreferences');
        if (!preferences) {
            await (0, storage_1.setStorageItem)('basicPreferences', {
                autoApprove: false
            });
        }
        // Set installation timestamp
        await (0, storage_1.setStorageItem)('installedAt', new Date().toISOString());
        logger_1.Logger.info('Extension initialization completed');
    }
    catch (error) {
        logger_1.Logger.error('Extension initialization failed', error);
        throw error;
    }
}
/**
 * Open onboarding flow for new users
 */
async function openOnboardingFlow() {
    try {
        const onboardingUrl = config_1.config.isDevelopment
            ? 'http://localhost:5173'
            : 'https://app.eventconnect.com';
        await chrome.tabs.create({ url: onboardingUrl });
        logger_1.Logger.info('Onboarding flow opened');
    }
    catch (error) {
        logger_1.Logger.error('Failed to open onboarding flow', error);
    }
}
/**
 * Migrate storage if needed for extension updates
 */
async function migrateStorageIfNeeded() {
    try {
        logger_1.Logger.info('Checking for storage migration needs');
        // Get current version from storage
        const storedVersion = await (0, storage_1.getStorageItem)('extensionVersion');
        const currentVersion = chrome.runtime.getManifest().version;
        if (storedVersion !== currentVersion) {
            logger_1.Logger.info('Extension version changed, performing migration', {
                from: storedVersion,
                to: currentVersion
            });
            // Perform any necessary migrations here
            // For now, just update the version
            await (0, storage_1.setStorageItem)('extensionVersion', currentVersion);
            logger_1.Logger.info('Storage migration completed');
        }
    }
    catch (error) {
        logger_1.Logger.error('Storage migration failed', error);
    }
}
/**
 * Validate authentication state on startup
 */
async function validateAuthenticationState() {
    try {
        logger_1.Logger.info('Validating authentication state');
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
            logger_1.Logger.info('User is authenticated');
            // Validate token with backend
            const isValid = await apiClient.auth.validateToken();
            if (!isValid) {
                logger_1.Logger.warn('Token validation failed, user may need to re-authenticate');
            }
        }
        else {
            logger_1.Logger.info('User is not authenticated');
        }
    }
    catch (error) {
        logger_1.Logger.error('Authentication validation failed', error);
    }
}
/**
 * Refresh current event context
 */
async function refreshCurrentEventContext() {
    try {
        logger_1.Logger.info('Refreshing current event context');
        // Try API first
        try {
            const currentEvent = await apiClient.events.getCurrentEvent();
            if (currentEvent) {
                await (0, storage_1.setStorageItem)('currentEventId', currentEvent.id);
                logger_1.Logger.info('Current event context updated from API', { eventId: currentEvent.id });
                return;
            }
        }
        catch (apiError) {
            logger_1.Logger.warn('API unavailable, checking local storage', apiError);
        }
        // Fallback to local storage
        const storedEventId = await (0, storage_1.getStorageItem)('currentEventId');
        if (storedEventId) {
            logger_1.Logger.info('Found locally stored event', { eventId: storedEventId });
        }
        else {
            logger_1.Logger.info('No current event found in API or local storage');
        }
    }
    catch (error) {
        logger_1.Logger.error('Failed to refresh event context', error);
    }
}
//# sourceMappingURL=service-worker.js.map