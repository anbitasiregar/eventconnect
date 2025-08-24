/**
 * Chrome Storage Utilities for EventConnect Extension
 * Provides type-safe storage operations for essential extension data
 */

interface ExtensionStorage {
  currentEventId?: string;
  authToken?: string;
  basicPreferences?: {
    autoApprove?: boolean;
  };
  installedAt?: string;
  extensionVersion?: string;
}

/**
 * Set an item in Chrome storage
 */
export async function setStorageItem<T>(key: keyof ExtensionStorage, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    throw new Error(`Storage operation failed: ${error}`);
  }
}

/**
 * Get an item from Chrome storage
 */
export async function getStorageItem<T>(key: keyof ExtensionStorage): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] ?? null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    throw new Error(`Storage operation failed: ${error}`);
  }
}

/**
 * Clear all extension storage
 */
export async function clearStorage(): Promise<void> {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw new Error(`Storage clear failed: ${error}`);
  }
}

/**
 * Get multiple storage items at once
 */
export async function getStorageItems<T extends keyof ExtensionStorage>(
  keys: T[]
): Promise<Pick<ExtensionStorage, T>> {
  try {
    const result = await chrome.storage.local.get(keys);
    return result as Pick<ExtensionStorage, T>;
  } catch (error) {
    console.error('Failed to get storage items:', error);
    throw new Error(`Storage operation failed: ${error}`);
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}
