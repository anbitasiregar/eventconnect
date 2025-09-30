/**
 * Google Drive Service for EventConnect Extension
 * Handles file downloads from Google Drive for ceremony videos
 */

import { Logger } from '../shared/logger';

export class GoogleDriveService {
  private static readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

  constructor(private getAuthToken: () => Promise<string>) {}

  /**
   * Download file from Google Drive by file ID
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const token = await this.getAuthToken();
      
      Logger.info(`[Drive] Downloading file: ${fileId}`);
      
      const response = await fetch(`${GoogleDriveService.DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Drive download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      Logger.info(`[Drive] Downloaded file from Drive: ${fileId} (${blob.size} bytes)`);
      return blob;
    } catch (error) {
      Logger.error(`[Drive] Failed to download file ${fileId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get file metadata from Google Drive
   */
  async getFileMetadata(fileId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${GoogleDriveService.DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Drive metadata request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      Logger.error(`[Drive] Failed to get metadata for file ${fileId}`, error as Error);
      throw error;
    }
  }

  /**
   * Extract file ID from Google Drive URL
   */
  static extractFileId(driveUrl: string): string | null {
    if (!driveUrl || typeof driveUrl !== 'string') {
      return null;
    }

    // Handle various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/open\?id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match && match[1]) {
        Logger.info(`[Drive] Extracted file ID: ${match[1]} from URL: ${driveUrl}`);
        return match[1];
      }
    }
    
    Logger.warn(`[Drive] Could not extract file ID from URL: ${driveUrl}`);
    return null;
  }

  /**
   * Validate if URL is a Google Drive link
   */
  static isGoogleDriveUrl(url: string): boolean {
    return url !== '' && url.includes('drive.google.com');
  }
}

