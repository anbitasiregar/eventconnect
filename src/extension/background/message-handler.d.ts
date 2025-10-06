/**
 * Enhanced Message Handler for EventConnect Extension
 * Routes messages to appropriate service handlers
 */
import { ExtensionMessage } from '../shared/messaging';
import { GoogleAuthService } from './google-auth';
import { ApiClient } from './api-client';
import { GoogleSheetsService } from './sheets-service';
export declare class MessageHandler {
    private authService;
    private apiClient;
    private sheetsService;
    private responseCache;
    private readonly CACHE_DURATION;
    private readonly RATE_LIMIT_WINDOW;
    private readonly RATE_LIMIT_MAX_REQUESTS;
    private requestCounts;
    constructor(authService: GoogleAuthService, apiClient: ApiClient, sheetsService: GoogleSheetsService);
    /**
     * Handle incoming extension messages
     */
    handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<any>;
    /**
   * Handle authentication-related messages
   */
    private handleAuthMessage;
    /**
     * Handle event management messages
     */
    private handleEventMessage;
    /**
     * Handle Google Sheets operation messages
     */
    private handleSheetsMessage;
    /**
     * Handle action execution messages
     */
    private handleActionMessage;
    /**
     * Check if message type is authentication-related
     */
    private isAuthMessage;
    /**
     * Check if message type is event-related
     */
    private isEventMessage;
    /**
     * Check if message type is sheets-related
     */
    private isSheetsMessage;
    /**
     * Check if message type is action-related
     */
    private isActionMessage;
    /**
     * Check if message type is a GET-like operation (cacheable)
     */
    private isGetOperation;
    /**
     * Generate cache key for message
     */
    private getCacheKey;
    /**
     * Get data from cache
     */
    private getFromCache;
    /**
     * Set data in cache
     */
    private setCache;
    /**
     * Clear all cache
     */
    private clearCache;
    /**
     * Clear event-related cache
     */
    private clearEventCache;
    /**
     * Clear sheets-specific cache
     */
    private clearSheetsCache;
    /**
     * Check rate limiting for sender
     */
    private checkRateLimit;
    /**
     * Get user-friendly error message
     */
    private getUserFriendlyError;
}
//# sourceMappingURL=message-handler.d.ts.map