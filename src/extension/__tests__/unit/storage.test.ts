/**
 * Unit tests for Chrome storage utilities
 */

import {
  setStorageItem,
  getStorageItem,
  clearStorage,
  getStorageItems,
  isStorageAvailable
} from '../../shared/storage';
import { mockStorageData, mockStorageError } from '../setup/test-setup';

describe('Chrome Storage Utilities', () => {
  describe('setStorageItem', () => {
    it('should set storage item successfully', async () => {
      const mockSet = jest.spyOn(chrome.storage.local, 'set');
      
      await setStorageItem('currentEventId', 'event-123');
      
      expect(mockSet).toHaveBeenCalledWith({ currentEventId: 'event-123' });
    });

    it('should throw error when storage fails', async () => {
      const error = new Error('Storage quota exceeded');
      mockStorageError(error);
      
      await expect(setStorageItem('currentEventId', 'event-123'))
        .rejects.toThrow('Storage operation failed: Error: Storage quota exceeded');
    });
  });

  describe('getStorageItem', () => {
    it('should get storage item successfully', async () => {
      mockStorageData({ currentEventId: 'event-123' });
      
      const result = await getStorageItem('currentEventId');
      
      expect(result).toBe('event-123');
    });

    it('should return null for non-existent item', async () => {
      mockStorageData({});
      
      const result = await getStorageItem('currentEventId');
      
      expect(result).toBeNull();
    });

    it('should throw error when storage fails', async () => {
      const error = new Error('Storage access denied');
      mockStorageError(error);
      
      await expect(getStorageItem('currentEventId'))
        .rejects.toThrow('Storage operation failed: Error: Storage access denied');
    });
  });

  describe('clearStorage', () => {
    it('should clear storage successfully', async () => {
      const mockClear = jest.spyOn(chrome.storage.local, 'clear');
      
      await clearStorage();
      
      expect(mockClear).toHaveBeenCalled();
    });

    it('should throw error when clear fails', async () => {
      const error = new Error('Clear operation failed');
      chrome.storage.local.clear.mockRejectedValue(error);
      
      await expect(clearStorage())
        .rejects.toThrow('Storage clear failed: Error: Clear operation failed');
    });
  });

  describe('getStorageItems', () => {
    it('should get multiple storage items successfully', async () => {
      mockStorageData({
        currentEventId: 'event-123',
        authToken: 'token-456'
      });
      
      const result = await getStorageItems(['currentEventId', 'authToken']);
      
      expect(result).toEqual({
        currentEventId: 'event-123',
        authToken: 'token-456'
      });
    });

    it('should handle partial data', async () => {
      mockStorageData({ currentEventId: 'event-123' });
      
      const result = await getStorageItems(['currentEventId', 'authToken']);
      
      expect(result).toEqual({
        currentEventId: 'event-123'
      });
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when chrome.storage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('should return false when chrome.storage is not available', () => {
      const originalChrome = (global as any).chrome;
      (global as any).chrome = undefined;
      
      expect(isStorageAvailable()).toBe(false);
      
      // Restore chrome mock
      (global as any).chrome = originalChrome;
    });

    it('should return false when chrome.storage.local is not available', () => {
      const originalStorage = chrome.storage;
      (chrome as any).storage = undefined;
      
      expect(isStorageAvailable()).toBe(false);
      
      // Restore storage mock
      (chrome as any).storage = originalStorage;
    });
  });
});
