/**
 * Google OAuth Authentication Service for EventConnect Extension
 * Handles secure authentication with comprehensive Google Workspace permissions
 */
interface GoogleAuthToken {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
    expires_at?: number;
}
export declare class GoogleAuthService {
    private static readonly TOKEN_REFRESH_BUFFER;
    /**
     * Authenticate user using Chrome Identity API
     */
    authenticateUser(): Promise<GoogleAuthToken>;
    /**
     * Check if user is currently authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Logout user and clear stored tokens
     */
    logout(): Promise<void>;
    /**
     * Get a valid access token (refresh if needed)
     */
    getValidToken(): Promise<string | null>;
    /**
     * Extract token from OAuth redirect URL
     */
    private extractTokenFromUrl;
    /**
     * Add expiration timestamp to token
     */
    private enrichTokenWithExpiration;
    /**
     * Store token securely in Chrome storage
     */
    private storeToken;
    /**
     * Retrieve stored token from Chrome storage
     */
    private getStoredToken;
    /**
     * Get Google OAuth client ID from environment or manifest
     */
    private getClientId;
}
export {};
//# sourceMappingURL=google-auth.d.ts.map