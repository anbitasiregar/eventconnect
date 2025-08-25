/**
 * Google OAuth Integration Tests for EventConnect Extension
 */

import { GoogleAuthService } from '../../background/google-auth';
import { 
  mockChromeIdentity, 
  mockSuccessfulOAuth, 
  mockFailedOAuth,
  mockGoogleAuthToken,
  resetAllMocks 
} from '../mocks/google-api-mocks';
import { mockStorageData } from '../setup/test-setup';

describe('Google OAuth Integration', () => {
  let authService: GoogleAuthService;

  beforeEach(() => {
    resetAllMocks();
    mockChromeIdentity();
    authService = new GoogleAuthService();
  });

  describe('Complete OAuth flow from start to token storage', () => {
    it('should complete OAuth flow successfully', async () => {
      // Mock successful OAuth flow
      mockSuccessfulOAuth();

      const token = await authService.authenticateUser();

      expect(token).toMatchObject({
        access_token: 'mock_access_token_12345',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: expect.stringContaining('spreadsheets')
      });

      // Verify token was stored
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authToken: expect.objectContaining({
          access_token: 'mock_access_token_12345',
          expires_at: expect.any(Number)
        })
      });
    });

    it('should handle OAuth cancellation gracefully', async () => {
      mockFailedOAuth('User cancelled authentication');

      await expect(authService.authenticateUser())
        .rejects.toThrow('Authentication was cancelled');
    });

    it('should handle access denied with clear error', async () => {
      mockFailedOAuth('access_denied');

      await expect(authService.authenticateUser())
        .rejects.toThrow('Access denied');
    });
  });

  /*
  describe('Token refresh before expiration', () => {
    it('should refresh token before expiration', async () => {
      const expiredToken = {
        ...mockGoogleAuthToken,
        expires_at: Date.now() - 1000, // Expired 1 second ago
        refresh_token: 'mock_refresh_token'
      };

      mockStorageData({ authToken: expiredToken });

      // Mock successful token refresh
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new_access_token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const newToken = await authService.refreshToken('mock_refresh_token');

      expect(newToken.access_token).toBe('new_access_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('refresh_token=mock_refresh_token')
        })
      );
    });

    it('should handle refresh token failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Invalid refresh token'
      });

      await expect(authService.refreshToken('invalid_refresh_token'))
        .rejects.toThrow('Failed to refresh authentication');
    });
  });
  */

  describe('Multiple permission scopes', () => {
    it('should request comprehensive workspace permissions', async () => {
      mockSuccessfulOAuth();

      await authService.authenticateUser();

      const authUrl = (chrome.identity.launchWebAuthFlow as jest.Mock).mock.calls[0][0].url;
      
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('spreadsheets');
      expect(authUrl).toContain('calendar');
      expect(authUrl).toContain('gmail.send');
      expect(authUrl).toContain('drive.file');
      expect(authUrl).toContain('userinfo.profile');
    });
  });

  describe('Authentication state persistence', () => {
    it('should persist authentication across extension restarts', async () => {
      const validToken = {
        ...mockGoogleAuthToken,
        expires_at: Date.now() + 3600000 // Valid for 1 hour
      };

      mockStorageData({ authToken: validToken });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      const token = await authService.getValidToken();
      expect(token).toBe(validToken.access_token);
    });

    it('should detect expired tokens', async () => {
      const expiredToken = {
        ...mockGoogleAuthToken,
        expires_at: Date.now() - 1000, // Expired
        refresh_token: undefined // No refresh token
      };

      mockStorageData({ authToken: expiredToken });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  /*
  describe('Network interruption scenarios', () => {
    it('should handle network errors during OAuth', async () => {
      (chrome.identity.launchWebAuthFlow as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(authService.authenticateUser())
        .rejects.toThrow('Authentication failed');
    });

    it('should handle network errors during token refresh', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(authService.refreshToken('mock_refresh_token'))
        .rejects.toThrow('Failed to refresh authentication');
    });
  });
  */
 
  describe('Logout functionality', () => {
    it('should clear stored tokens on logout', async () => {
      mockStorageData({ authToken: mockGoogleAuthToken });

      // Mock token revocation
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await authService.logout();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authToken: null
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('revoke'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle logout even if token revocation fails', async () => {
      mockStorageData({ authToken: mockGoogleAuthToken });

      // Mock failed token revocation (non-critical)
      global.fetch = jest.fn().mockRejectedValue(new Error('Revocation failed'));

      await expect(authService.logout()).resolves.not.toThrow();

      // Should still clear local storage
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authToken: null
      });
    });
  });
});
