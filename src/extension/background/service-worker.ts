/**
 * EventConnect Extension Service Worker
 * Enhanced with full authentication, API communication, and Google Sheets integration
 */

import { GoogleAuthService } from './google-auth';
import { ApiClient } from './api-client';
import { GoogleSheetsService } from './sheets-service';
import { MessageHandler } from './message-handler';
import { config, validateConfig } from './config';
import { Logger, initializeLogger } from '../shared/logger';
import { setStorageItem, getStorageItem } from '../shared/storage';

// Initialize services
let authService: GoogleAuthService;
let apiClient: ApiClient;
let sheetsService: GoogleSheetsService;
let messageHandler: MessageHandler;

// Service worker installation
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    // Initialize logging first
    initializeLogger();
    Logger.info('EventConnect extension installed', { reason: details.reason });

    // Validate configuration
    if (!validateConfig()) {
      throw new Error('Configuration validation failed');
    }

    // Initialize services
    await initializeServices();
    
    if (details.reason === 'install') {
      // First-time installation
      await initializeExtension();
      await openOnboardingFlow();
    } else if (details.reason === 'update') {
      // Extension update
      await migrateStorageIfNeeded();
    }
    
    Logger.info('Extension initialization completed successfully');
  } catch (error) {
    Logger.error('Extension initialization failed', error as Error);
  }
});

// Service worker startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    Logger.info('EventConnect extension started');
    
    // Initialize services if not already done
    if (!authService) {
      await initializeServices();
    }
    
    // Validate authentication state
    await validateAuthenticationState();
    
    // Refresh current event context
    await refreshCurrentEventContext();
    
    Logger.info('Extension startup completed');
  } catch (error) {
    Logger.error('Extension startup failed', error as Error);
  }
});

// Message routing with enhanced handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleAsyncMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      Logger.error('Message handling error', error as Error, { 
        messageType: message.type,
        requestId: message.requestId 
      });
      sendResponse({ error: (error as Error).message });
    });
  return true; // Keep message channel open for async response
});

async function handleAsyncMessage(message: any, sender: chrome.runtime.MessageSender) {
  // Ensure services are initialized
  if (!messageHandler) {
    await initializeServices();
  }
  
  return await messageHandler.handleMessage(message, sender);
}

/**
 * Initialize all extension services
 */
async function initializeServices(): Promise<void> {
  try {
    Logger.info('Initializing extension services');

    // Initialize authentication service
    authService = new GoogleAuthService();
    
    // Initialize API client
    apiClient = new ApiClient(config.apiBaseUrl, authService);
    
    // Initialize Google Sheets service
    sheetsService = new GoogleSheetsService(() => authService.getValidToken());
    
    // Initialize message handler
    messageHandler = new MessageHandler(authService, apiClient, sheetsService);
    
    Logger.info('All services initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize services', error as Error);
    throw error;
  }
}

/**
 * Initialize extension on first install
 */
async function initializeExtension(): Promise<void> {
  try {
    Logger.info('Performing first-time extension initialization');
    
    // Set default preferences
    const preferences = await getStorageItem('basicPreferences');
    if (!preferences) {
      await setStorageItem('basicPreferences', {
        autoApprove: false
      });
    }
    
    // Set installation timestamp
    await setStorageItem('installedAt', new Date().toISOString());
    
    Logger.info('Extension initialization completed');
  } catch (error) {
    Logger.error('Extension initialization failed', error as Error);
    throw error;
  }
}

/**
 * Open onboarding flow for new users
 */
async function openOnboardingFlow(): Promise<void> {
  try {
    const onboardingUrl = config.isDevelopment 
      ? 'http://localhost:5173' 
      : 'https://app.eventconnect.com';
    
    await chrome.tabs.create({ url: onboardingUrl });
    Logger.info('Onboarding flow opened');
  } catch (error) {
    Logger.error('Failed to open onboarding flow', error as Error);
  }
}

/**
 * Migrate storage if needed for extension updates
 */
async function migrateStorageIfNeeded(): Promise<void> {
  try {
    Logger.info('Checking for storage migration needs');
    
    // Get current version from storage
    const storedVersion = await getStorageItem<string>('extensionVersion');
    const currentVersion = chrome.runtime.getManifest().version;
    
    if (storedVersion !== currentVersion) {
      Logger.info('Extension version changed, performing migration', {
        from: storedVersion,
        to: currentVersion
      });
      
      // Perform any necessary migrations here
      // For now, just update the version
      await setStorageItem('extensionVersion', currentVersion);
      
      Logger.info('Storage migration completed');
    }
  } catch (error) {
    Logger.error('Storage migration failed', error as Error);
  }
}

/**
 * Validate authentication state on startup
 */
async function validateAuthenticationState(): Promise<void> {
  try {
    Logger.info('Validating authentication state');
    
    const isAuthenticated = await authService.isAuthenticated();
    
    if (isAuthenticated) {
      Logger.info('User is authenticated');
      
      // Validate token with backend
      const isValid = await apiClient.auth.validateToken();
      if (!isValid) {
        Logger.warn('Token validation failed, user may need to re-authenticate');
      }
    } else {
      Logger.info('User is not authenticated');
    }
  } catch (error) {
    Logger.error('Authentication validation failed', error as Error);
  }
}

/**
 * Refresh current event context
 */
async function refreshCurrentEventContext(): Promise<void> {
  try {
    Logger.info('Refreshing current event context');
    
    const currentEvent = await apiClient.events.getCurrentEvent();
    
    if (currentEvent) {
      await setStorageItem('currentEventId', currentEvent.id);
      Logger.info('Current event context updated', { eventId: currentEvent.id });
    } else {
      Logger.info('No current event found');
    }
  } catch (error) {
    Logger.error('Failed to refresh event context', error as Error);
  }
}
