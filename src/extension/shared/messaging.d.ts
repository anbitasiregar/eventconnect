/**
 * Message Passing System for EventConnect Extension
 * Handles communication between extension components
 */
export type MessageType = 'AUTH_STATUS' | 'AUTH_LOGIN' | 'AUTH_LOGOUT' | 'AUTH_REFRESH' | 'LOGIN_REQUEST' | 'LOGOUT_REQUEST' | 'GET_CURRENT_EVENT' | 'SET_CURRENT_EVENT' | 'VALIDATE_SHEET' | 'READ_EVENT_DATA' | 'UPDATE_EVENT_DATA' | 'APPEND_LOG' | 'SHEETS_' | 'EXECUTE_ACTION' | 'GET_ACTION_SUGGESTIONS' | 'GET_USER_INFO';
export interface ExtensionMessage {
    type: MessageType;
    payload?: any;
    requestId?: string;
}
export type MessageHandler = (message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void | boolean | Promise<any>;
/**
 * Send message to background script
 */
export declare function sendMessageToBackground(message: ExtensionMessage): Promise<any>;
/**
 * Set up message listener
 */
export declare function setupMessageListener(handler: MessageHandler): void;
/**
 * Check if messaging is available
 */
export declare function isMessagingAvailable(): boolean;
//# sourceMappingURL=messaging.d.ts.map