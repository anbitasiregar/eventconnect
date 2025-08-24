/**
 * Backend API Client for EventConnect Extension
 * Handles communication with EventConnect server
 */

import { Logger } from '../shared/logger';
import { GoogleAuthService } from './google-auth';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  sheetsId: string;
  status: 'planning' | 'in_progress' | 'completed';
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

export class ApiClient {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second base delay

  constructor(
    private baseUrl: string,
    private authService: GoogleAuthService
  ) {}

  /**
   * Make authenticated request to backend API
   */
  async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= ApiClient.MAX_RETRIES; attempt++) {
      try {
        Logger.debug(`API request attempt ${attempt}/${ApiClient.MAX_RETRIES}: ${options.method || 'GET'} ${url}`);

        const token = await this.authService.getValidToken();
        if (!token) {
          throw new Error('No valid authentication token available');
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        };

        const requestOptions: RequestInit = {
          method: options.method || 'GET',
          headers,
          ...(options.body && { body: JSON.stringify(options.body) })
        };

        const response = await fetch(url, requestOptions);

        // Handle different response status codes
        if (response.status === 401) {
          Logger.warn('Authentication failed, token may be invalid');
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
        Logger.debug(`API request successful: ${options.method || 'GET'} ${url}`);
        
        return result as T;

      } catch (error) {
        lastError = error as Error;
        Logger.warn(`API request attempt ${attempt} failed:`, lastError);

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

    Logger.error(`API request failed after ${ApiClient.MAX_RETRIES} attempts`, lastError!);
    throw lastError!;
  }

  /**
   * Authentication endpoints
   */
  auth = {
    validateToken: async (): Promise<boolean> => {
      try {
        await this.makeAuthenticatedRequest('/api/auth/validate');
        return true;
      } catch (error) {
        Logger.warn('Token validation failed', error as Error);
        return false;
      }
    },

    getUserInfo: async (): Promise<UserInfo> => {
      return await this.makeAuthenticatedRequest<UserInfo>('/api/auth/user');
    }
  };

  /**
   * Event management endpoints
   */
  events = {
    getCurrentEvent: async (): Promise<Event | null> => {
      try {
        return await this.makeAuthenticatedRequest<Event>('/api/events/current');
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          return null;
        }
        throw error;
      }
    },

    setCurrentEvent: async (eventId: string): Promise<void> => {
      await this.makeAuthenticatedRequest('/api/events/current', {
        method: 'POST',
        body: { eventId }
      });
    },

    validateEventSheet: async (sheetId: string): Promise<boolean> => {
      try {
        const result = await this.makeAuthenticatedRequest<{ valid: boolean }>('/api/events/validate-sheet', {
          method: 'POST',
          body: { sheetId }
        });
        return result.valid;
      } catch (error) {
        Logger.warn('Sheet validation failed', error as Error);
        return false;
      }
    }
  };

  /**
   * Google Sheets proxy endpoints (for complex operations)
   */
  sheets = {
    readEventData: async (sheetId: string): Promise<any> => {
      return await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/data`);
    },

    updateEventData: async (sheetId: string, data: any): Promise<void> => {
      await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/data`, {
        method: 'PUT',
        body: data
      });
    },

    appendEventLog: async (sheetId: string, entry: LogEntry): Promise<void> => {
      await this.makeAuthenticatedRequest(`/api/sheets/${sheetId}/log`, {
        method: 'POST',
        body: entry
      });
    }
  };

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update base URL (useful for environment switching)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    Logger.info(`API base URL updated to: ${url}`);
  }
}
