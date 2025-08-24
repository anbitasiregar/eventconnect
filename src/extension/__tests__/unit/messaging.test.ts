/**
 * Unit tests for Chrome messaging utilities
 */

import {
  sendMessageToBackground,
  setupMessageListener,
  isMessagingAvailable,
  MessageType,
  ExtensionMessage
} from '../../shared/messaging';
import { mockMessageResponse, mockMessageError } from '../setup/test-setup';

describe('Chrome Messaging Utilities', () => {
  describe('sendMessageToBackground', () => {
    it('should send message successfully', async () => {
      const mockResponse = { success: true, data: 'test-data' };
      mockMessageResponse(mockResponse);
      
      const message: ExtensionMessage = {
        type: 'GET_CURRENT_EVENT',
        payload: { test: true }
      };
      
      const result = await sendMessageToBackground(message);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        ...message,
        requestId: expect.stringMatching(/^req_\d+_[a-z0-9]{9}$/)
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error responses', async () => {
      mockMessageResponse({ error: 'Authentication failed' });
      
      const message: ExtensionMessage = {
        type: 'LOGIN_REQUEST'
      };
      
      await expect(sendMessageToBackground(message))
        .rejects.toThrow('Authentication failed');
    });

    it('should handle messaging errors', async () => {
      const error = new Error('Runtime connection lost');
      mockMessageError(error);
      
      const message: ExtensionMessage = {
        type: 'AUTH_STATUS'
      };
      
      await expect(sendMessageToBackground(message))
        .rejects.toThrow('Message sending failed: Error: Runtime connection lost');
    });
  });

  describe('setupMessageListener', () => {
    it('should set up message listener successfully', () => {
      const mockHandler = jest.fn();
      const mockAddListener = jest.spyOn(chrome.runtime.onMessage, 'addListener');
      
      setupMessageListener(mockHandler);
      
      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle valid messages', () => {
      const mockHandler = jest.fn(() => ({ success: true }));
      const mockSendResponse = jest.fn();
      
      setupMessageListener(mockHandler);
      
      // Get the listener function that was registered
      const listenerCall = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0];
      const listener = listenerCall[0];
      
      const validMessage: ExtensionMessage = {
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
      
      setupMessageListener(mockHandler);
      
      const listenerCall = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0];
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
      
      setupMessageListener(mockHandler);
      
      const listenerCall = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0];
      const listener = listenerCall[0];
      
      const validMessage: ExtensionMessage = {
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
      
      setupMessageListener(mockHandler);
      
      const listenerCall = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0];
      const listener = listenerCall[0];
      
      const validMessage: ExtensionMessage = {
        type: 'AUTH_STATUS'
      };
      
      listener(validMessage, {}, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({ error: 'Handler error' });
    });

    it('should handle unavailable runtime', () => {
      const originalOnMessage = chrome.runtime.onMessage;
      (chrome.runtime as any).onMessage = undefined;
      
      const mockHandler = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      setupMessageListener(mockHandler);
      
      expect(consoleSpy).toHaveBeenCalledWith('Chrome runtime messaging not available');
      
      // Restore
      (chrome.runtime as any).onMessage = originalOnMessage;
      consoleSpy.mockRestore();
    });
  });

  describe('isMessagingAvailable', () => {
    it('should return true when messaging is available', () => {
      expect(isMessagingAvailable()).toBe(true);
    });

    it('should return false when chrome is undefined', () => {
      const originalChrome = (global as any).chrome;
      (global as any).chrome = undefined;
      
      expect(isMessagingAvailable()).toBe(false);
      
      (global as any).chrome = originalChrome;
    });

    it('should return false when runtime is undefined', () => {
      const originalRuntime = chrome.runtime;
      (chrome as any).runtime = undefined;
      
      expect(isMessagingAvailable()).toBe(false);
      
      (chrome as any).runtime = originalRuntime;
    });

    it('should return false when sendMessage is undefined', () => {
      const originalSendMessage = chrome.runtime.sendMessage;
      (chrome.runtime as any).sendMessage = undefined;
      
      expect(isMessagingAvailable()).toBe(false);
      
      (chrome.runtime as any).sendMessage = originalSendMessage;
    });
  });
});
