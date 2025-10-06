"use strict";
/**
 * Chrome Storage Utilities for EventConnect Extension
 * Provides type-safe storage operations for essential extension data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStorageItem = setStorageItem;
exports.getStorageItem = getStorageItem;
exports.clearStorage = clearStorage;
exports.getStorageItems = getStorageItems;
exports.isStorageAvailable = isStorageAvailable;
/**
 * Set an item in Chrome storage
 */
async function setStorageItem(key, value) {
    try {
        await chrome.storage.local.set({ [key]: value });
    }
    catch (error) {
        console.error(`Failed to set storage item ${key}:`, error);
        throw new Error(`Storage operation failed: ${error}`);
    }
}
/**
 * Get an item from Chrome storage
 */
async function getStorageItem(key) {
    try {
        const result = await chrome.storage.local.get([key]);
        return result[key] ?? null;
    }
    catch (error) {
        console.error(`Failed to get storage item ${key}:`, error);
        throw new Error(`Storage operation failed: ${error}`);
    }
}
/**
 * Clear all extension storage
 */
async function clearStorage() {
    try {
        await chrome.storage.local.clear();
    }
    catch (error) {
        console.error('Failed to clear storage:', error);
        throw new Error(`Storage clear failed: ${error}`);
    }
}
/**
 * Get multiple storage items at once
 */
async function getStorageItems(keys) {
    try {
        const result = await chrome.storage.local.get(keys);
        return result;
    }
    catch (error) {
        console.error('Failed to get storage items:', error);
        throw new Error(`Storage operation failed: ${error}`);
    }
}
/**
 * Check if storage is available
 */
function isStorageAvailable() {
    return typeof chrome !== 'undefined' && !!chrome.storage;
}
//# sourceMappingURL=storage.js.map