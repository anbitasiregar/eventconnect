import { Logger } from '../shared/logger';

/**
 * IndexedDB wrapper for persistent ceremony video storage
 * Survives service worker terminations during long bulk send operations
 */
export class CeremonyStorage {
  private static readonly DB_NAME = 'EventConnectCeremonies';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'videos';
  
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(CeremonyStorage.DB_NAME, CeremonyStorage.DB_VERSION);

      request.onerror = () => {
        Logger.error('[IndexedDB] Failed to open database', request.error as Error);
        reject(request.error);
      };

      request.onsuccess = () => {
        Logger.info('[IndexedDB] Database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(CeremonyStorage.STORE_NAME)) {
          db.createObjectStore(CeremonyStorage.STORE_NAME);
          Logger.info('[IndexedDB] Object store created');
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Store a ceremony video blob in IndexedDB
   */
  async storeVideo(ceremonyId: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.put(blob, ceremonyId);

      request.onsuccess = () => {
        Logger.info(`[IndexedDB] Stored video: ${ceremonyId} (${blob.size} bytes)`);
        resolve();
      };

      request.onerror = () => {
        Logger.error(`[IndexedDB] Failed to store ${ceremonyId}`, request.error as Error);
        reject(request.error);
      };
    });
  }

  /**
   * Retrieve a ceremony video blob from IndexedDB
   */
  async getVideo(ceremonyId: string): Promise<Blob | null> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.get(ceremonyId);

      request.onsuccess = () => {
        const blob = request.result as Blob | undefined;
        if (blob) {
          Logger.info(`[IndexedDB] Retrieved video: ${ceremonyId} (${blob.size} bytes)`);
        } else {
          Logger.warn(`[IndexedDB] Video not found: ${ceremonyId}`);
        }
        resolve(blob || null);
      };

      request.onerror = () => {
        Logger.error(`[IndexedDB] Failed to retrieve ${ceremonyId}`, request.error as Error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if a video exists in IndexedDB
   */
  async hasVideo(ceremonyId: string): Promise<boolean> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.getKey(ceremonyId);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all stored ceremony IDs
   */
  async getAllKeys(): Promise<string[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all ceremony videos from IndexedDB
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        Logger.info('[IndexedDB] All ceremony videos cleared');
        resolve();
      };

      request.onerror = () => {
        Logger.error('[IndexedDB] Failed to clear videos', request.error as Error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific video from IndexedDB
   */
  async deleteVideo(ceremonyId: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CeremonyStorage.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CeremonyStorage.STORE_NAME);
      const request = store.delete(ceremonyId);

      request.onsuccess = () => {
        Logger.info(`[IndexedDB] Deleted video: ${ceremonyId}`);
        resolve();
      };

      request.onerror = () => {
        Logger.error(`[IndexedDB] Failed to delete ${ceremonyId}`, request.error as Error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
      Logger.info('[IndexedDB] Database connection closed');
    }
  }
}
