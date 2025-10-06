"use strict";
/**
 * Unit tests for Chrome storage utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("../../shared/storage");
const test_setup_1 = require("../setup/test-setup");
describe('Chrome Storage Utilities', () => {
    describe('setStorageItem', () => {
        it('should set storage item successfully', async () => {
            const mockSet = jest.spyOn(chrome.storage.local, 'set');
            await (0, storage_1.setStorageItem)('currentEventId', 'event-123');
            expect(mockSet).toHaveBeenCalledWith({ currentEventId: 'event-123' });
        });
        it('should throw error when storage fails', async () => {
            const error = new Error('Storage quota exceeded');
            (0, test_setup_1.mockStorageError)(error);
            await expect((0, storage_1.setStorageItem)('currentEventId', 'event-123'))
                .rejects.toThrow('Storage operation failed: Error: Storage quota exceeded');
        });
    });
    describe('getStorageItem', () => {
        it('should get storage item successfully', async () => {
            (0, test_setup_1.mockStorageData)({ currentEventId: 'event-123' });
            const result = await (0, storage_1.getStorageItem)('currentEventId');
            expect(result).toBe('event-123');
        });
        it('should return null for non-existent item', async () => {
            (0, test_setup_1.mockStorageData)({});
            const result = await (0, storage_1.getStorageItem)('currentEventId');
            expect(result).toBeNull();
        });
        it('should throw error when storage fails', async () => {
            const error = new Error('Storage access denied');
            (0, test_setup_1.mockStorageError)(error);
            await expect((0, storage_1.getStorageItem)('currentEventId'))
                .rejects.toThrow('Storage operation failed: Error: Storage access denied');
        });
    });
    describe('clearStorage', () => {
        it('should clear storage successfully', async () => {
            const mockClear = jest.spyOn(chrome.storage.local, 'clear');
            await (0, storage_1.clearStorage)();
            expect(mockClear).toHaveBeenCalled();
        });
        it('should throw error when clear fails', async () => {
            const error = new Error('Clear operation failed');
            chrome.storage.local.clear.mockRejectedValue(error);
            await expect((0, storage_1.clearStorage)())
                .rejects.toThrow('Storage clear failed: Error: Clear operation failed');
        });
    });
    describe('getStorageItems', () => {
        it('should get multiple storage items successfully', async () => {
            (0, test_setup_1.mockStorageData)({
                currentEventId: 'event-123',
                authToken: 'token-456'
            });
            const result = await (0, storage_1.getStorageItems)(['currentEventId', 'authToken']);
            expect(result).toEqual({
                currentEventId: 'event-123',
                authToken: 'token-456'
            });
        });
        it('should handle partial data', async () => {
            (0, test_setup_1.mockStorageData)({ currentEventId: 'event-123' });
            const result = await (0, storage_1.getStorageItems)(['currentEventId', 'authToken']);
            expect(result).toEqual({
                currentEventId: 'event-123'
            });
        });
    });
    describe('isStorageAvailable', () => {
        it('should return true when chrome.storage is available', () => {
            expect((0, storage_1.isStorageAvailable)()).toBe(true);
        });
        it('should return false when chrome.storage is not available', () => {
            const originalChrome = global.chrome;
            global.chrome = undefined;
            expect((0, storage_1.isStorageAvailable)()).toBe(false);
            // Restore chrome mock
            global.chrome = originalChrome;
        });
        it('should return false when chrome.storage.local is not available', () => {
            const originalStorage = chrome.storage;
            chrome.storage = undefined;
            expect((0, storage_1.isStorageAvailable)()).toBe(false);
            // Restore storage mock
            chrome.storage = originalStorage;
        });
    });
});
//# sourceMappingURL=storage.test.js.map