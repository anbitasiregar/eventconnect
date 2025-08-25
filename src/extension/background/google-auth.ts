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
  expires_at: number; // Calculated expiration timestamp
}

export class GoogleAuthService {
  private static readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in ms
  private static readonly OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  /**
   * Authenticate user using Chrome Identity API
   */
  async authenticateUser(): Promise<GoogleAuthToken> {
    try {
      Logger.info('Starting Google OAuth authentication flow');

      const authUrl = this.buildAuthUrl();
      Logger.info('Auth URL built:', authUrl);
      
      Logger.info('Extension ID from Chrome:', chrome.runtime.id);
      Logger.info('Expected redirect URI:', chrome.identity.getRedirectURL());
      
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      Logger.info('OAuth flow completed, redirect URL:', redirectUrl);

      if (!redirectUrl) {
        throw new Error('Authentication was cancelled by user');
      }

      const token = this.extractTokenFromUrl(redirectUrl);
      Logger.info('Token extracted successfully');
      
      const enrichedToken = this.enrichTokenWithExpiration(token);
      
      // Store token securely
      await this.storeToken(enrichedToken);
      
      Logger.info('Google OAuth authentication successful');
      return enrichedToken;
      
    } catch (error) {
      Logger.error('Google OAuth authentication failed', error as Error);
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          throw new Error('Authentication was cancelled. Please try again to access your Google account.');
        } else if (error.message.includes('access_denied')) {
          throw new Error('Access denied. EventConnect needs these permissions to manage your event data.');
        } else if (error.message.includes('OAuth')) {
          throw new Error('OAuth configuration error. Please check the extension setup.');
        }
      }
      
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh expired token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<GoogleAuthToken> {
    try {
      Logger.info('Refreshing Google OAuth token');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: await this.getClientId(),
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      const enrichedToken = this.enrichTokenWithExpiration(tokenData);
      
      // Preserve refresh token if not provided in response
      if (!enrichedToken.refresh_token) {
        enrichedToken.refresh_token = refreshToken;
      }
      
      await this.storeToken(enrichedToken);
      
      Logger.info('Token refresh successful');
      return enrichedToken;
      
    } catch (error) {
      Logger.error('Token refresh failed', error as Error);
      throw new Error('Failed to refresh authentication. Please sign in again.');
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      
      if (!token) {
        return false;
      }

      // Check if token is expired (with buffer)
      const now = Date.now();
      const isExpired = now >= (token.expires_at - GoogleAuthService.TOKEN_REFRESH_BUFFER);
      
      if (isExpired && !token.refresh_token) {
        Logger.warn('Token expired and no refresh token available');
        return false;
      }

      return true;
    } catch (error) {
      Logger.error('Authentication check failed', error as Error);
      return false;
    }
  }

  /**
   * Logout user and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      Logger.info('Logging out user');
      
      // Clear stored token
      await setStorageItem('authToken', null);
      
      // Revoke token with Google (optional, best practice)
      const token = await this.getStoredToken();
      if (token) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${token.access_token}`, {
            method: 'POST'
          });
        } catch (error) {
          Logger.warn('Token revocation failed (non-critical)', error as Error);
        }
      }
      
      Logger.info('Logout successful');
    } catch (error) {
      Logger.error('Logout failed', error as Error);
      throw new Error('Logout failed. Please try again.');
    }
  }

  /**
   * Get a valid access token (refresh if needed)
   */
  async getValidToken(): Promise<string | null> {
    try {
      const token = await this.getStoredToken();
      
      if (!token) {
        Logger.warn('No stored token found');
        return null;
      }

      const now = Date.now();
      const needsRefresh = now >= (token.expires_at - GoogleAuthService.TOKEN_REFRESH_BUFFER);
      
      if (needsRefresh) {
        if (!token.refresh_token) {
          Logger.warn('Token expired and no refresh token available');
          return null;
        }
        
        Logger.info('Token needs refresh, refreshing automatically');
        const refreshedToken = await this.refreshToken(token.refresh_token);
        return refreshedToken.access_token;
      }
      
      return token.access_token;
    } catch (error) {
      Logger.error('Failed to get valid token', error as Error);
      return null;
    }
  }

  /**
   * Build OAuth authorization URL
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '554258518238-9fs00eer4665qggru39lfmi4o6jrq42n.apps.googleusercontent.com',
      redirect_uri: chrome.identity.getRedirectURL(),
      response_type: 'token',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${GoogleAuthService.OAUTH_URL}?${params.toString()}`;
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
