/**
 * Enhanced Message Handler for EventConnect Extension
 * Routes messages to appropriate service handlers
 */

import { ExtensionMessage } from '../shared/messaging';
import { GoogleAuthService } from './google-auth';
import { ApiClient } from './api-client';
import { GoogleSheetsService } from './sheets-service';
import { Logger } from '../shared/logger';

export class MessageHandler {
  private responseCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private authService: GoogleAuthService,
    private apiClient: ApiClient,
    private sheetsService: GoogleSheetsService
  ) {}

  /**
   * Handle incoming extension messages
   */
  async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    try {
      Logger.debug(`Handling message: ${message.type}`, { 
        requestId: message.requestId,
        sender: sender.tab?.url 
      });

      // Rate limiting check
      if (!this.checkRateLimit(sender)) {
        throw new Error('Rate limit exceeded. Please slow down your requests.');
      }

      // Check cache for GET-like operations
      const cacheKey = this.getCacheKey(message);
      if (cacheKey && this.isGetOperation(message.type)) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          Logger.debug(`Returning cached response for: ${message.type}`);
          return cached;
        }
      }

      let response: any;

      // Route message to appropriate handler
      switch (true) {
        case this.isAuthMessage(message.type):
          response = await this.handleAuthMessage(message);
          break;

        case this.isEventMessage(message.type):
          response = await this.handleEventMessage(message);
          break;

        case this.isSheetsMessage(message.type):
          response = await this.handleSheetsMessage(message);
          break;

        case this.isActionMessage(message.type):
          response = await this.handleActionMessage(message);
          break;

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }

      // Cache successful responses for GET-like operations
      if (cacheKey && this.isGetOperation(message.type) && response) {
        this.setCache(cacheKey, response);
      }

      Logger.debug(`Message handled successfully: ${message.type}`, { 
        requestId: message.requestId 
      });

      return response;

    } catch (error) {
      Logger.error(`Message handling failed: ${message.type}`, error as Error, { 
        requestId: message.requestId 
      });

      // Return user-friendly error message
      const errorMessage = this.getUserFriendlyError(error as Error, message.type);
      return { error: errorMessage };
    }
  }

  /**
 * Handle authentication-related messages
 */
  private async handleAuthMessage(message: ExtensionMessage): Promise<any> {
    switch (message.type) {
      case 'AUTH_LOGIN':
        try {
          const token = await this.authService.authenticateUser();
          return { success: true, token };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage };
        }

      case 'AUTH_LOGOUT':
        try {
          await this.authService.logout();
          this.clearCache(); // Clear all cached data on logout
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage };
        }

      case 'AUTH_STATUS':
        try {
          const isAuthenticated = await this.authService.isAuthenticated();
          const validToken = isAuthenticated ? await this.authService.getValidToken() : null;
          return { 
            success: true,
            authenticated: isAuthenticated,
            hasValidToken: !!validToken
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { 
            success: false, 
            authenticated: false, 
            hasValidToken: false,
            error: errorMessage 
          };
        }

      case 'AUTH_REFRESH':
        // Since Chrome Identity API handles refresh automatically,
        // we'll just re-authenticate to get a fresh token
        try {
          console.log('Token refresh requested - re-authenticating via Chrome Identity API');
          const token = await this.authService.authenticateUser();
          return { success: true, token };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Token refresh failed:', errorMessage);
          return { 
            success: false, 
            error: 'Failed to refresh token. Please sign in again.' 
          };
        }

      default:
        return { 
          success: false, 
          error: `Unknown auth message type: ${message.type}` 
        };
    }
  }

  /**
   * Handle event management messages
   */
  private async handleEventMessage(message: ExtensionMessage): Promise<any> {
    switch (message.type) {
      case 'GET_CURRENT_EVENT':
        const currentEvent = await this.apiClient.events.getCurrentEvent();
        return { event: currentEvent };

      case 'SET_CURRENT_EVENT':
        case 'SET_CURRENT_EVENT':
        try {
          const { eventId } = message.payload;
          if (!eventId) {
            throw new Error('Event ID required');
          }
          
          // Store current event ID
          await chrome.storage.local.set({ 
            currentEventId: eventId,
            currentEventTimestamp: Date.now()
          });
          
          // Clear cache to force refresh of event data
          this.clearCache();
          
          return { success: true, eventId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { success: false, error: errorMessage };
        }

        case 'VALIDATE_SHEET':
          try {
            const { sheetId } = message.payload;
            if (!sheetId) {
              throw new Error('Sheet ID required');
            }
            
            console.log('Validating sheet access:', sheetId);
            
            // Use the sheets service to validate access
            const isValid = await this.sheetsService.validateSheetStructure(sheetId);
            
            if (isValid) {
              // Try to get sheet name for better UX
              const sheetInfo = await this.sheetsService.getSheetName(sheetId);
              return { 
                success: true, 
                message: 'Sheet validated successfully',
                eventName: sheetInfo?.name || 'Event Dashboard'
              };
            } else {
              return { 
                success: false, 
                error: 'Cannot access sheet. Please check sharing permissions and Sheet ID.' 
              };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Sheet validation failed:', errorMessage);
            return { 
              success: false, 
              error: `Sheet validation failed: ${errorMessage}` 
            };
          }

      default:
        throw new Error(`Unknown event message type: ${message.type}`);
    }
  }

  /**
   * Handle Google Sheets operation messages
   */
  private async handleSheetsMessage(message: ExtensionMessage): Promise<any> {
    switch (message.type) {
      case 'READ_EVENT_DATA':
        if (!message.payload?.sheetId) {
          throw new Error('Sheet ID required');
        }
        const eventData = await this.sheetsService.readEventSheet(message.payload.sheetId);
        return { data: eventData };
  
      case 'UPDATE_EVENT_DATA':
        if (!message.payload?.sheetId || !message.payload?.data) {
          throw new Error('Sheet ID and data required');
        }
        await this.sheetsService.updateEventData(message.payload.sheetId, message.payload.data);
        this.clearSheetsCache(message.payload.sheetId); // Clear cache for this sheet
        return { success: true };
  
      case 'APPEND_LOG':
        if (!message.payload?.sheetId || !message.payload?.entry) {
          throw new Error('Sheet ID and log entry required');
        }
        await this.sheetsService.appendToEventLog(message.payload.sheetId, message.payload.entry);
        return { success: true };
  
      case 'VALIDATE_SHEET':
        try {
          const { sheetId } = message.payload;
          if (!sheetId) {
            throw new Error('Sheet ID required');
          }
          
          console.log('Validating sheet with README structure:', sheetId);
          
          const result = await this.sheetsService.validateSheetStructure(sheetId);
          
          if (result.isValid) {
            // Store sheet structure for future use
            await chrome.storage.local.set({
              [`sheetStructure_${sheetId}`]: result.structure,
              [`sheetStructure_timestamp_${sheetId}`]: Date.now()
            });

            return { 
              success: true, 
              message: 'Sheet structure read successfully from README tab',
              eventName: result.structure?.sheetTitle || 'Event Dashboard',
              structure: {
                totalTabs: result.structure?.totalTabs || 0,
                tabs: Object.keys(result.structure?.tabs || {})
              }
            };
          } else {
            return { 
              success: false, 
              error: result.error || 'Failed to read sheet structure' 
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Sheet validation failed:', errorMessage);
          return { 
            success: false, 
            error: `Sheet validation failed: ${errorMessage}` 
          };
        }

      case 'GET_SHEET_INFO':
        try {
          const { sheetId } = message.payload;
          if (!sheetId) {
            throw new Error('Sheet ID required');
          }
      
          // Get basic sheet info to check if still accessible
          const sheetInfo = await this.sheetsService.getSheetInfo(sheetId);
          
          if (sheetInfo) {
            return { 
              success: true, 
              eventName: sheetInfo.name,
              sheetId 
            };
          } else {
            return { 
              success: false, 
              error: 'Sheet no longer accessible' 
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return { 
            success: false, 
            error: errorMessage 
          };
        }
  
      default:
        throw new Error(`Unknown sheets message type: ${message.type}`);
    }
  }

  /**
   * Handle action execution messages
   */
  private async handleActionMessage(message: ExtensionMessage): Promise<any> {
    switch (message.type) {
      case 'EXECUTE_ACTION':
        if (!message.payload?.action) {
          throw new Error('Action type required');
        }
        
        // For now, return placeholder response
        // This will be fully implemented in Part C
        Logger.info(`Action execution requested: ${message.payload.action}`);
        return { 
          success: true, 
          message: `Action "${message.payload.action}" queued for execution`,
          placeholder: true 
        };

      case 'GET_ACTION_SUGGESTIONS':
        // Placeholder for AI-powered action suggestions
        return { 
          suggestions: [
            { id: 'check_budget', title: 'Check Budget Status', priority: 'high' },
            { id: 'upcoming_tasks', title: 'View Upcoming Tasks', priority: 'medium' },
            { id: 'vendor_contacts', title: 'Get Vendor Contacts', priority: 'low' }
          ],
          placeholder: true
        };

      default:
        throw new Error(`Unknown action message type: ${message.type}`);
    }
  }

  /**
   * Check if message type is authentication-related
   */
  private isAuthMessage(type: string): boolean {
    return ['AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_STATUS', 'AUTH_REFRESH'].includes(type);
  }

  /**
   * Check if message type is event-related
   */
  private isEventMessage(type: string): boolean {
    return ['GET_CURRENT_EVENT', 'SET_CURRENT_EVENT', 'VALIDATE_SHEET', 'GET_SHEET_INFO'].includes(type);
  }

  /**
   * Check if message type is sheets-related
   */
  private isSheetsMessage(type: string): boolean {
    return ['READ_EVENT_DATA', 'UPDATE_EVENT_DATA', 'APPEND_LOG', 'SHEETS_'].includes(type);
  }

  /**
   * Check if message type is action-related
   */
  private isActionMessage(type: string): boolean {
    return ['EXECUTE_ACTION', 'GET_ACTION_SUGGESTIONS'].includes(type);
  }

  /**
   * Check if message type is a GET-like operation (cacheable)
   */
  private isGetOperation(type: string): boolean {
    return [
      'AUTH_STATUS',
      'GET_CURRENT_EVENT',
      'READ_EVENT_DATA',
      'GET_ACTION_SUGGESTIONS',
      'VALIDATE_SHEET',
      'GET_SHEET_INFO'
    ].includes(type);
  }

  /**
   * Generate cache key for message
   */
  private getCacheKey(message: ExtensionMessage): string | null {
    if (!this.isGetOperation(message.type)) {
      return null;
    }

    const baseKey = message.type;
    const payload = message.payload ? JSON.stringify(message.payload) : '';
    return `${baseKey}:${payload}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.responseCache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.responseCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cache
   */
  private clearCache(): void {
    this.responseCache.clear();
    Logger.debug('Response cache cleared');
  }

  /**
   * Clear event-related cache
   */
  private clearEventCache(): void {
    for (const key of this.responseCache.keys()) {
      if (key.startsWith('GET_CURRENT_EVENT') || key.startsWith('READ_EVENT_DATA')) {
        this.responseCache.delete(key);
      }
    }
    Logger.debug('Event cache cleared');
  }

  /**
   * Clear sheets-specific cache
   */
  private clearSheetsCache(sheetId: string): void {
    for (const key of this.responseCache.keys()) {
      if (key.includes(`"sheetId":"${sheetId}"`)) {
        this.responseCache.delete(key);
      }
    }
    Logger.debug(`Sheets cache cleared for: ${sheetId}`);
  }

  /**
   * Check rate limiting for sender
   */
  private checkRateLimit(sender: chrome.runtime.MessageSender): boolean {
    const senderId = sender.tab?.id?.toString() || 'unknown';
    const now = Date.now();

    let senderData = this.requestCounts.get(senderId);
    if (!senderData || now > senderData.resetTime) {
      senderData = {
        count: 0,
        resetTime: now + this.RATE_LIMIT_WINDOW
      };
    }

    senderData.count++;
    this.requestCounts.set(senderId, senderData);

    if (senderData.count > this.RATE_LIMIT_MAX_REQUESTS) {
      Logger.warn(`Rate limit exceeded for sender: ${senderId}`);
      return false;
    }

    return true;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyError(error: Error, messageType: string): string {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
      return 'Please sign in to your Google account to continue.';
    }

    if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      return 'You don\'t have permission to access this resource. Please check your Google account permissions.';
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    if (errorMessage.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    if (errorMessage.includes('sheet') && errorMessage.includes('not found')) {
      return 'The requested Google Sheet could not be found. Please check the sheet ID and your permissions.';
    }

    if (errorMessage.includes('quota')) {
      return 'Google API quota exceeded. Please try again later.';
    }

    // Return original error message for debugging in development
    if (process.env.NODE_ENV === 'development') {
      return `${messageType} failed: ${error.message}`;
    }

    // Generic error for production
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }
}
