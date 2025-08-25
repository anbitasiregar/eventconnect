/**
 * Google OAuth Authentication Service for EventConnect Extension
 * Handles secure authentication with comprehensive Google Workspace permissions
 */

import { setStorageItem, getStorageItem } from '../shared/storage';
import { Logger } from '../shared/logger';

// Environment variables are replaced at build time by webpack DefinePlugin
declare const process: {
  env: {
    GOOGLE_CLIENT_ID: string;
  };
};

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',      // Sheets read/write
  'https://www.googleapis.com/auth/calendar',          // Calendar integration
  'https://www.googleapis.com/auth/gmail.send',        // Email sending
  'https://www.googleapis.com/auth/drive.file',        // Drive file access
  'https://www.googleapis.com/auth/userinfo.profile'   // Basic profile info
];

interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  expires_at?: number; // Make this optional since Chrome handles expiration
}

export class GoogleAuthService {
  private static readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in ms
  
  /**
   * Authenticate user using Chrome Identity API
   */
  async authenticateUser(): Promise<GoogleAuthToken> {
    try {
      console.log('Starting Chrome Identity API authentication...');
      
      const result = await chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: GOOGLE_SCOPES 
      });
      
      console.log('Raw token result:', result);
      
      // Extract token string from result - fix the undefined issue
      let tokenString: string;
      if (typeof result === 'string') {
        tokenString = result;
      } else if (result && typeof result === 'object' && 'token' in result) {
        const token = result.token;
        if (!token) {  // Check if token is undefined/empty
          throw new Error('Empty token received from Chrome Identity API');
        }
        tokenString = token;  // Now TypeScript knows it's not undefined
      } else {
        throw new Error('Invalid token format received from Chrome Identity API');
      }
      
      if (!tokenString) {
        throw new Error('No authentication token received from Google');
      }
      
      console.log('Authentication successful, token received');
      
      const authToken: GoogleAuthToken = {
        access_token: tokenString,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: GOOGLE_SCOPES.join(' '),
        expires_at: Date.now() + (3600 * 1000)
      };
      
      await chrome.storage.local.set({
        'authToken': authToken,
        'authTokenTimestamp': Date.now()
      });
      
      return authToken;
      
    } catch (error) {
      console.error('Chrome Identity API authentication failed:', error);
      
      // Fix the error typing issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('canceled') || errorMessage.includes('cancelled')) {
        throw new Error('Sign-in was canceled. Please try again.');
      } else if (errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        throw new Error(`Authentication failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      return !!token;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Logout user and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      // Get current token for revocation
      const stored = await chrome.storage.local.get('authToken');
      
      if (stored.authToken?.access_token) {
        // Revoke token with Chrome Identity API
        await chrome.identity.removeCachedAuthToken({ 
          token: stored.authToken.access_token 
        });
      }
      
      // Clear all stored auth data
      await chrome.storage.local.remove(['authToken', 'authTokenTimestamp', 'currentEventId']);
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if revocation fails
      await chrome.storage.local.remove(['authToken', 'authTokenTimestamp', 'currentEventId']);
    }
  }

  /**
   * Get a valid access token (refresh if needed)
   */
  async getValidToken(): Promise<string | null> {
    try {
      const stored = await chrome.storage.local.get(['authToken', 'authTokenTimestamp']);
      
      if (stored.authToken?.access_token) {
        const expiresAt = stored.authToken.expires_at || (stored.authTokenTimestamp + (3600 * 1000));
        const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
        
        if (expiresAt > fiveMinutesFromNow) {
          return stored.authToken.access_token;
        } else {
          console.log('Token expired, getting fresh token...');
        }
      }
      
      // Get fresh token using Chrome Identity API (non-interactive)
      const result = await chrome.identity.getAuthToken({ 
        interactive: false,
        scopes: GOOGLE_SCOPES 
      });
      
      let tokenString: string;
      if (typeof result === 'string') {
        tokenString = result;
      } else if (result && typeof result === 'object' && 'token' in result) {
        const token = result.token;
        if (!token) {  // Check if token is undefined/empty
          console.log('No valid token available - empty token from API');
          return null;
        }
        tokenString = token;  // Now TypeScript knows it's not undefined
      } else {
        console.log('No valid token available - invalid result format');
        return null;
      }
      
      if (!tokenString) {
        console.log('No valid token available - empty token string');
        return null;
      }
      
      // Update stored token
      const authToken: GoogleAuthToken = {
        access_token: tokenString,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: GOOGLE_SCOPES.join(' '),
        expires_at: Date.now() + (3600 * 1000)
      };
      
      await chrome.storage.local.set({
        'authToken': authToken,
        'authTokenTimestamp': Date.now()
      });
      
      return tokenString;
      
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Extract token from OAuth redirect URL
   */
  private extractTokenFromUrl(url: string): Partial<GoogleAuthToken> {
    const hashParams = new URLSearchParams(url.split('#')[1]);
    
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('token_type') || 'Bearer';
    const expiresIn = parseInt(hashParams.get('expires_in') || '3600');
    const scope = hashParams.get('scope') || '';
    
    if (!accessToken) {
      throw new Error('No access token received from OAuth flow');
    }

    return {
      access_token: accessToken,
      token_type: tokenType,
      expires_in: expiresIn,
      scope: scope
    };
  }

  /**
   * Add expiration timestamp to token
   */
  private enrichTokenWithExpiration(token: Partial<GoogleAuthToken>): GoogleAuthToken {
    const now = Date.now();
    const expiresIn = token.expires_in || 3600;
    
    return {
      access_token: token.access_token!,
      refresh_token: token.refresh_token,
      expires_in: expiresIn,
      token_type: token.token_type || 'Bearer',
      scope: token.scope || '',
      expires_at: now + (expiresIn * 1000)
    };
  }

  /**
   * Store token securely in Chrome storage
   */
  private async storeToken(token: GoogleAuthToken): Promise<void> {
    // In production, consider encrypting sensitive token data
    await setStorageItem('authToken', token);
  }

  /**
   * Retrieve stored token from Chrome storage
   */
  private async getStoredToken(): Promise<GoogleAuthToken | null> {
    return await getStorageItem<GoogleAuthToken>('authToken');
  }

  /**
   * Get Google OAuth client ID from environment or manifest
   */
  private async getClientId(): Promise<string> {
    // In production, this should come from secure configuration
    return process.env.GOOGLE_CLIENT_ID || '554258518238-9fs00eer4665qggru39lfmi4o6jrq42n.apps.googleusercontent.com';
  }
}
