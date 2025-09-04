/**
 * Message Passing System for EventConnect Extension
 * Handles communication between extension components
 */

export type MessageType = 
  // Authentication messages
  | 'AUTH_STATUS' 
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_REFRESH'
  // Legacy auth
  | 'LOGIN_REQUEST' 
  | 'LOGOUT_REQUEST'
  // Event management
  | 'GET_CURRENT_EVENT' 
  | 'SET_CURRENT_EVENT'
  | 'VALIDATE_SHEET'
  // Sheet operations
  | 'READ_EVENT_DATA'
  | 'UPDATE_EVENT_DATA'
  | 'APPEND_LOG'
  | 'SHEETS_'
  // Actions
  | 'EXECUTE_ACTION'
  | 'GET_ACTION_SUGGESTIONS'
  // User info
  | 'GET_USER_INFO'
  // WhatsApp
  | 'GET_PENDING_WHATSAPP_GUESTS'
  | 'UPDATE_SHEET_STATUS'
  | 'VALIDATE_WHATSAPP_SHEET'
  | 'START_BULK_WHATSAPP_SEND'
  ;

export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
  requestId?: string;
}

export type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => void | boolean | Promise<any>;

/**
 * Send message to background script
 */
export async function sendMessageToBackground(message: ExtensionMessage): Promise<any> {
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
  } catch (error) {
    console.error('Failed to send message to background:', error);
    throw new Error(`Message sending failed: ${error}`);
  }
}

/**
 * Set up message listener
 */
export function setupMessageListener(handler: MessageHandler): void {
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
      const result = handler(message as ExtensionMessage, sender, sendResponse);
      
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
    } catch (error) {
      console.error('Message listener error:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate message structure
 */
function isValidMessage(message: any): message is ExtensionMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    ['AUTH_STATUS', 'LOGIN_REQUEST', 'LOGOUT_REQUEST', 'GET_CURRENT_EVENT', 'SET_CURRENT_EVENT', 'EXECUTE_ACTION'].includes(message.type)
  );
}

/**
 * Check if messaging is available
 */
export function isMessagingAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
}
