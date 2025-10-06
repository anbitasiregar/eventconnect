"use strict";
/**
 * Unit tests for Chrome messaging utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const messaging_1 = require("../../shared/messaging");
const test_setup_1 = require("../setup/test-setup");
describe('Chrome Messaging Utilities', () => {
    describe('sendMessageToBackground', () => {
        it('should send message successfully', async () => {
            const mockResponse = { success: true, data: 'test-data' };
            (0, test_setup_1.mockMessageResponse)(mockResponse);
            const message = {
                type: 'GET_CURRENT_EVENT',
                payload: { test: true }
            };
            const result = await (0, messaging_1.sendMessageToBackground)(message);
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                ...message,
                requestId: expect.stringMatching(/^req_\d+_[a-z0-9]{9}$/)
            });
            expect(result).toEqual(mockResponse);
        });
        it('should handle error responses', async () => {
            (0, test_setup_1.mockMessageResponse)({ error: 'Authentication failed' });
            const message = {
                type: 'LOGIN_REQUEST'
            };
            await expect((0, messaging_1.sendMessageToBackground)(message))
                .rejects.toThrow('Authentication failed');
        });
        it('should handle messaging errors', async () => {
            const error = new Error('Runtime connection lost');
            (0, test_setup_1.mockMessageError)(error);
            const message = {
                type: 'AUTH_STATUS'
            };
            await expect((0, messaging_1.sendMessageToBackground)(message))
                .rejects.toThrow('Message sending failed: Error: Runtime connection lost');
        });
    });
    describe('setupMessageListener', () => {
        it('should set up message listener successfully', () => {
            const mockHandler = jest.fn();
            const mockAddListener = jest.spyOn(chrome.runtime.onMessage, 'addListener');
            (0, messaging_1.setupMessageListener)(mockHandler);
            expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
        });
        it('should handle valid messages', () => {
            const mockHandler = jest.fn(() => ({ success: true }));
            const mockSendResponse = jest.fn();
            (0, messaging_1.setupMessageListener)(mockHandler);
            // Get the listener function that was registered
            const listenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const listener = listenerCall[0];
            const validMessage = {
                type: 'AUTH_STATUS',
                requestId: 'test-123'
            };
            const result = listener(validMessage, {}, mockSendResponse);
            expect(mockHandler).toHaveBeenCalledWith(validMessage, {}, mockSendResponse);
            expect(result).toEqual({ success: true });
        });
        it('should reject invalid messages', () => {
            const mockHandler = jest.fn();
            const mockSendResponse = jest.fn();
            (0, messaging_1.setupMessageListener)(mockHandler);
            const listenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const listener = listenerCall[0];
            const invalidMessage = {
                type: 'INVALID_TYPE',
                payload: {}
            };
            listener(invalidMessage, {}, mockSendResponse);
            expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Invalid message format' });
            expect(mockHandler).not.toHaveBeenCalled();
        });
        it('should handle async handler responses', async () => {
            const mockHandler = jest.fn(() => Promise.resolve({ success: true }));
            const mockSendResponse = jest.fn();
            (0, messaging_1.setupMessageListener)(mockHandler);
            const listenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const listener = listenerCall[0];
            const validMessage = {
                type: 'EXECUTE_ACTION',
                payload: { action: 'test' }
            };
            const result = listener(validMessage, {}, mockSendResponse);
            expect(result).toBe(true); // Should return true for async handling
            // Wait for promise to resolve
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
        });
        it('should handle handler errors', () => {
            const mockHandler = jest.fn(() => {
                throw new Error('Handler error');
            });
            const mockSendResponse = jest.fn();
            (0, messaging_1.setupMessageListener)(mockHandler);
            const listenerCall = chrome.runtime.onMessage.addListener.mock.calls[0];
            const listener = listenerCall[0];
            const validMessage = {
                type: 'AUTH_STATUS'
            };
            listener(validMessage, {}, mockSendResponse);
            expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Handler error' });
        });
        it('should handle unavailable runtime', () => {
            const originalOnMessage = chrome.runtime.onMessage;
            chrome.runtime.onMessage = undefined;
            const mockHandler = jest.fn();
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (0, messaging_1.setupMessageListener)(mockHandler);
            expect(consoleSpy).toHaveBeenCalledWith('Chrome runtime messaging not available');
            // Restore
            chrome.runtime.onMessage = originalOnMessage;
            consoleSpy.mockRestore();
        });
    });
    describe('isMessagingAvailable', () => {
        it('should return true when messaging is available', () => {
            expect((0, messaging_1.isMessagingAvailable)()).toBe(true);
        });
        it('should return false when chrome is undefined', () => {
            const originalChrome = global.chrome;
            global.chrome = undefined;
            expect((0, messaging_1.isMessagingAvailable)()).toBe(false);
            global.chrome = originalChrome;
        });
        it('should return false when runtime is undefined', () => {
            const originalRuntime = chrome.runtime;
            chrome.runtime = undefined;
            expect((0, messaging_1.isMessagingAvailable)()).toBe(false);
            chrome.runtime = originalRuntime;
        });
        it('should return false when sendMessage is undefined', () => {
            const originalSendMessage = chrome.runtime.sendMessage;
            chrome.runtime.sendMessage = undefined;
            expect((0, messaging_1.isMessagingAvailable)()).toBe(false);
            chrome.runtime.sendMessage = originalSendMessage;
        });
    });
});
//# sourceMappingURL=messaging.test.js.map