/**
 * Test environment setup for EventConnect Chrome Extension
 * Provides Chrome API mocks and testing utilities
 */

import '@testing-library/jest-dom';

// Mock Chrome Extension APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'EventConnect Test'
    }))
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn(),
    update: jest.fn()
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Make chrome available globally
(global as any).chrome = mockChrome;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset storage mocks to default behavior
  mockChrome.storage.local.get.mockImplementation((keys) => {
    return Promise.resolve({});
  });
  
  mockChrome.storage.local.set.mockImplementation(() => {
    return Promise.resolve();
  });
  
  mockChrome.storage.local.clear.mockImplementation(() => {
    return Promise.resolve();
  });
  
  mockChrome.runtime.sendMessage.mockImplementation(() => {
    return Promise.resolve({ success: true });
  });
});

// Utility functions for testing
export const mockStorageData = (data: Record<string, any>) => {
  mockChrome.storage.local.get.mockImplementation((keys) => {
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      keys.forEach(key => {
        if (data[key] !== undefined) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    } else if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    } else {
      return Promise.resolve(data);
    }
  });
};

export const mockStorageError = (error: Error) => {
  mockChrome.storage.local.get.mockRejectedValue(error);
  mockChrome.storage.local.set.mockRejectedValue(error);
};

export const mockMessageResponse = (response: any) => {
  mockChrome.runtime.sendMessage.mockResolvedValue(response);
};

export const mockMessageError = (error: Error) => {
  mockChrome.runtime.sendMessage.mockRejectedValue(error);
};

// Console error suppression for expected test errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
