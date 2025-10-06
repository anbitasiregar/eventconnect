"use strict";
/**
 * Unit tests for Google Auth Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_1 = require("../../background/google-auth");
const test_setup_1 = require("../setup/test-setup");
const google_api_mocks_1 = require("../mocks/google-api-mocks");
describe('GoogleAuthService', () => {
    let authService;
    beforeEach(() => {
        (0, google_api_mocks_1.resetAllMocks)();
        (0, google_api_mocks_1.mockChromeIdentity)();
        authService = new google_auth_1.GoogleAuthService();
    });
    describe('authenticateUser', () => {
        it('should complete OAuth flow and return token', async () => {
            (0, google_api_mocks_1.mockSuccessfulOAuth)();
            const result = await authService.authenticateUser();
            expect(result).toMatchObject({
                access_token: 'mock_access_token_12345',
                token_type: 'Bearer',
                expires_in: 3600,
                expires_at: expect.any(Number)
            });
        });
        it('should handle user cancellation', async () => {
            chrome.identity.launchWebAuthFlow.mockResolvedValue(null);
            await expect(authService.authenticateUser())
                .rejects.toThrow('Authentication was cancelled by user');
        });
        it('should handle OAuth errors', async () => {
            (0, google_api_mocks_1.mockFailedOAuth)('OAuth error');
            await expect(authService.authenticateUser())
                .rejects.toThrow('Authentication failed');
        });
        it('should handle missing access token in response', async () => {
            chrome.identity.launchWebAuthFlow.mockResolvedValue('chrome-extension://test/oauth#token_type=Bearer&expires_in=3600');
            await expect(authService.authenticateUser())
                .rejects.toThrow('No access token received');
        });
    });
    describe('isAuthenticated', () => {
        it('should return true for valid unexpired token', async () => {
            const validToken = {
                access_token: 'valid_token',
                expires_at: Date.now() + 3600000, // 1 hour from now
                refresh_token: 'refresh_token'
            };
            (0, test_setup_1.mockStorageData)({ authToken: validToken });
            const result = await authService.isAuthenticated();
            expect(result).toBe(true);
        });
        it('should return false for expired token without refresh token', async () => {
            const expiredToken = {
                access_token: 'expired_token',
                expires_at: Date.now() - 1000 // Expired
            };
            (0, test_setup_1.mockStorageData)({ authToken: expiredToken });
            const result = await authService.isAuthenticated();
            expect(result).toBe(false);
        });
        it('should return true for expired token with refresh token', async () => {
            const expiredToken = {
                access_token: 'expired_token',
                expires_at: Date.now() - 1000, // Expired
                refresh_token: 'refresh_token'
            };
            (0, test_setup_1.mockStorageData)({ authToken: expiredToken });
            const result = await authService.isAuthenticated();
            expect(result).toBe(true);
        });
        it('should return false when no token stored', async () => {
            (0, test_setup_1.mockStorageData)({});
            const result = await authService.isAuthenticated();
            expect(result).toBe(false);
        });
        it('should handle storage errors', async () => {
            (0, test_setup_1.mockStorageError)(new Error('Storage error'));
            const result = await authService.isAuthenticated();
            expect(result).toBe(false);
        });
    });
    describe('getValidToken', () => {
        it('should return valid token without refresh', async () => {
            const validToken = {
                access_token: 'valid_token',
                expires_at: Date.now() + 3600000 // 1 hour from now
            };
            (0, test_setup_1.mockStorageData)({ authToken: validToken });
            const result = await authService.getValidToken();
            expect(result).toBe('valid_token');
        });
        it('should refresh expired token', async () => {
            const expiredToken = {
                access_token: 'expired_token',
                expires_at: Date.now() - 1000, // Expired
                refresh_token: 'refresh_token'
            };
            (0, test_setup_1.mockStorageData)({ authToken: expiredToken });
            // Mock successful token refresh
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'new_token',
                    expires_in: 3600,
                    token_type: 'Bearer'
                })
            });
            const result = await authService.getValidToken();
            expect(result).toBe('new_token');
            expect(fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', expect.objectContaining({ method: 'POST' }));
        });
        it('should return null for expired token without refresh token', async () => {
            const expiredToken = {
                access_token: 'expired_token',
                expires_at: Date.now() - 1000 // Expired, no refresh_token
            };
            (0, test_setup_1.mockStorageData)({ authToken: expiredToken });
            const result = await authService.getValidToken();
            expect(result).toBeNull();
        });
    });
    /*
    describe('refreshToken', () => {
      it('should refresh token successfully', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new_access_token',
            expires_in: 3600,
            token_type: 'Bearer'
          })
        });
  
        const result = await authService.refreshToken('refresh_token');
  
        expect(result.access_token).toBe('new_access_token');
        expect(result.expires_at).toBeGreaterThan(Date.now());
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          authToken: expect.objectContaining({
            access_token: 'new_access_token'
          })
        });
      });
  
      it('should preserve refresh token when not returned', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new_access_token',
            expires_in: 3600,
            token_type: 'Bearer'
            // No refresh_token in response
          })
        });
  
        const result = await authService.refreshToken('original_refresh_token');
  
        expect(result.refresh_token).toBe('original_refresh_token');
      });
  
      it('should handle refresh token errors', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          statusText: 'Invalid refresh token'
        });
  
        await expect(authService.refreshToken('invalid_token'))
          .rejects.toThrow('Failed to refresh authentication');
      });
  
      it('should handle network errors during refresh', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
        await expect(authService.refreshToken('refresh_token'))
          .rejects.toThrow('Failed to refresh authentication');
      });
    });
    */
    describe('logout', () => {
        it('should clear stored token', async () => {
            (0, test_setup_1.mockStorageData)({ authToken: { access_token: 'token' } });
            global.fetch = jest.fn().mockResolvedValue({ ok: true });
            await authService.logout();
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                authToken: null
            });
        });
        it('should revoke token with Google', async () => {
            (0, test_setup_1.mockStorageData)({ authToken: { access_token: 'token_to_revoke' } });
            global.fetch = jest.fn().mockResolvedValue({ ok: true });
            await authService.logout();
            expect(fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/revoke?token=token_to_revoke', { method: 'POST' });
        });
        it('should handle revocation errors gracefully', async () => {
            (0, test_setup_1.mockStorageData)({ authToken: { access_token: 'token' } });
            global.fetch = jest.fn().mockRejectedValue(new Error('Revocation failed'));
            await expect(authService.logout()).resolves.not.toThrow();
            // Should still clear local storage
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                authToken: null
            });
        });
        it('should handle missing stored token', async () => {
            (0, test_setup_1.mockStorageData)({});
            global.fetch = jest.fn();
            await expect(authService.logout()).resolves.not.toThrow();
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                authToken: null
            });
            expect(fetch).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=google-auth.test.js.map