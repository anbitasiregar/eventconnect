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
export declare function setStorageItem<T>(key: keyof ExtensionStorage, value: T): Promise<void>;
/**
 * Get an item from Chrome storage
 */
export declare function getStorageItem<T>(key: keyof ExtensionStorage): Promise<T | null>;
/**
 * Clear all extension storage
 */
export declare function clearStorage(): Promise<void>;
/**
 * Get multiple storage items at once
 */
export declare function getStorageItems<T extends keyof ExtensionStorage>(keys: T[]): Promise<Pick<ExtensionStorage, T>>;
/**
 * Check if storage is available
 */
export declare function isStorageAvailable(): boolean;
export {};
//# sourceMappingURL=storage.d.ts.map