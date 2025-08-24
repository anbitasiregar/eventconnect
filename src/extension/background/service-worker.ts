/**
 * EventConnect Extension Service Worker
 * Handles background operations, authentication, and API communication
 */

import { setupMessageListener, ExtensionMessage } from '../shared/messaging';
import { setStorageItem, getStorageItem } from '../shared/storage';

// Service worker installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('EventConnect extension installed:', details.reason);
  
  try {
    // Initialize default storage values
    await initializeStorage();
    
    // Open onboarding web app for new installations
    if (details.reason === 'install') {
      await openOnboardingApp();
    }
    
    console.log('Extension initialization completed');
  } catch (error) {
    console.error('Extension initialization failed:', error);
  }
});

// Service worker startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('EventConnect extension started');
  
  try {
    // Check authentication status
    const authToken = await getStorageItem('authToken');
    if (authToken) {
      console.log('User authentication found');
      // TODO: Validate token in Part B
    } else {
      console.log('No user authentication found');
    }
  } catch (error) {
    console.error('Startup check failed:', error);
  }
});

// Set up message listener for component communication
setupMessageListener(async (message: ExtensionMessage, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  try {
    switch (message.type) {
      case 'AUTH_STATUS':
        return await handleAuthStatus();
      
      case 'LOGIN_REQUEST':
        return await handleLoginRequest();
      
      case 'LOGOUT_REQUEST':
        return await handleLogoutRequest();
      
      case 'GET_CURRENT_EVENT':
        return await handleGetCurrentEvent();
      
      case 'SET_CURRENT_EVENT':
        return await handleSetCurrentEvent(message.payload);
      
      case 'EXECUTE_ACTION':
        return await handleExecuteAction(message.payload);
      
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    console.error(`Error handling message ${message.type}:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

/**
 * Initialize storage with default values
 */
async function initializeStorage(): Promise<void> {
  try {
    // Set default preferences if not exists
    const preferences = await getStorageItem('basicPreferences');
    if (!preferences) {
      await setStorageItem('basicPreferences', {
        autoApprove: false
      });
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    throw error;
  }
}

/**
 * Open onboarding web application
 */
async function openOnboardingApp(): Promise<void> {
  try {
    const onboardingUrl = 'http://localhost:5173'; // Web app URL
    await chrome.tabs.create({ url: onboardingUrl });
  } catch (error) {
    console.error('Failed to open onboarding app:', error);
  }
}

/**
 * Handle authentication status check
 */
async function handleAuthStatus(): Promise<{ authenticated: boolean; token?: string }> {
  const authToken = await getStorageItem<string>('authToken');
  return {
    authenticated: !!authToken,
    token: authToken || undefined
  };
}

/**
 * Handle login request - placeholder for Part B
 */
async function handleLoginRequest(): Promise<{ success: boolean; message: string }> {
  // TODO: Implement Google OAuth flow in Part B
  console.log('Login request received - will implement in Part B');
  return {
    success: false,
    message: 'Login functionality will be implemented in Part B'
  };
}

/**
 * Handle logout request
 */
async function handleLogoutRequest(): Promise<{ success: boolean }> {
  try {
    await setStorageItem('authToken', null);
    await setStorageItem('currentEventId', null);
    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    return { success: false };
  }
}

/**
 * Handle get current event
 */
async function handleGetCurrentEvent(): Promise<{ eventId: string | null }> {
  const currentEventId = await getStorageItem<string>('currentEventId');
  return { eventId: currentEventId };
}

/**
 * Handle set current event
 */
async function handleSetCurrentEvent(payload: { eventId: string }): Promise<{ success: boolean }> {
  try {
    await setStorageItem('currentEventId', payload.eventId);
    return { success: true };
  } catch (error) {
    console.error('Failed to set current event:', error);
    return { success: false };
  }
}

/**
 * Handle execute action - placeholder for Part B/C
 */
async function handleExecuteAction(payload: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement action execution in later parts
  console.log('Action execution request received:', payload);
  return {
    success: false,
    message: 'Action execution will be implemented in later parts'
  };
}
