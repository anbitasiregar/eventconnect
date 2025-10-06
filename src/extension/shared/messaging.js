"use strict";
/**
 * Message Passing System for EventConnect Extension
 * Handles communication between extension components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToBackground = sendMessageToBackground;
exports.setupMessageListener = setupMessageListener;
exports.isMessagingAvailable = isMessagingAvailable;
/**
 * Send message to background script
 */
async function sendMessageToBackground(message) {
    try {
        // Add unique request ID for tracking
        const messageWithId = {
            ...message,
            requestId: generateRequestId()
        };
        const response = await chrome.runtime.sendMessage(messageWithId);
        if (response && response.error) {
            throw new Error(response.error);
        }
        return response;
    }
    catch (error) {
        console.error('Failed to send message to background:', error);
        throw new Error(`Message sending failed: ${error}`);
    }
}
/**
 * Set up message listener
 */
function setupMessageListener(handler) {
    if (!chrome.runtime.onMessage) {
        console.error('Chrome runtime messaging not available');
        return;
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            // Validate message structure
            if (!isValidMessage(message)) {
                console.warn('Received invalid message:', message);
                sendResponse({ error: 'Invalid message format' });
                return;
            }
            // Call handler and handle async responses
            const result = handler(message, sender, sendResponse);
            // If handler returns a promise, handle it
            if (result instanceof Promise) {
                result
                    .then(response => sendResponse(response))
                    .catch(error => {
                    console.error('Message handler error:', error);
                    sendResponse({ error: error.message });
                });
                return true; // Keep message channel open for async response
            }
            return result;
        }
        catch (error) {
            console.error('Message listener error:', error);
            sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
}
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Validate message structure
 */
function isValidMessage(message) {
    return (message &&
        typeof message === 'object' &&
        typeof message.type === 'string' &&
        ['AUTH_STATUS', 'LOGIN_REQUEST', 'LOGOUT_REQUEST', 'GET_CURRENT_EVENT', 'SET_CURRENT_EVENT', 'EXECUTE_ACTION'].includes(message.type));
}
/**
 * Check if messaging is available
 */
function isMessagingAvailable() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
}
//# sourceMappingURL=messaging.js.map