/**
 * Backend API Client for EventConnect Extension
 * Handles communication with EventConnect server
 */
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
    status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
}
interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'warning' | 'error';
}
export declare class ApiClient {
    private baseUrl;
    private authService;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    constructor(baseUrl: string, authService: GoogleAuthService);
    /**
     * Make authenticated request to backend API
     */
    makeAuthenticatedRequest<T>(endpoint: string, options?: RequestOptions): Promise<T>;
    /**
     * Authentication endpoints
     */
    auth: {
        validateToken: () => Promise<boolean>;
        getUserInfo: () => Promise<UserInfo>;
    };
    /**
     * Event management endpoints
     */
    events: {
        getCurrentEvent: () => Promise<Event | null>;
        setCurrentEvent: (eventId: string) => Promise<void>;
        validateEventSheet: (sheetId: string) => Promise<boolean>;
    };
    /**
     * Google Sheets proxy endpoints (for complex operations)
     */
    sheets: {
        readEventData: (sheetId: string) => Promise<any>;
        updateEventData: (sheetId: string, data: any) => Promise<void>;
        appendEventLog: (sheetId: string, entry: LogEntry) => Promise<void>;
    };
    /**
     * Sleep utility for retry delays
     */
    private sleep;
    /**
     * Get current base URL
     */
    getBaseUrl(): string;
    /**
     * Update base URL (useful for environment switching)
     */
    setBaseUrl(url: string): void;
}
export {};
//# sourceMappingURL=api-client.d.ts.map