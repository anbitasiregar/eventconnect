/**
 * WhatsApp Coordinator - Background Script
 * Orchestrates the bulk WhatsApp invitation sending process
 */

import { Guest, SendProgress, SendResult, WhatsAppCoordinator, WhatsAppMessage } from '../shared/whatsapp-types';
import { Logger } from '../shared/logger';
import { messageHandler } from './service-worker';
import { ceremonyStorage } from './service-worker';
import { driveService } from './service-worker';
import { Ceremony } from '../popup/context/EventContext';

class WhatsAppCoordinatorImpl implements WhatsAppCoordinator {
  private currentSendingProcess: {
    guests: Guest[];
    progress: SendProgress;
    results: SendResult[];
    whatsappTabId?: number;
  } | null = null;


  private readonly RETRY_ATTEMPTS = 1; // CHANGE THIS BACK!!!!!!!
  private readonly SEND_DELAY = 3000; // 3 seconds between messages

  /**
   * Start bulk sending process
   */
  async startBulkSending(guests: Guest[]): Promise<void> {
    try {
      Logger.info(`Starting bulk WhatsApp sending for ${guests.length} guests`);

      // Download and store all unique ceremony files once
      await this.downloadAndStoreCeremonies(guests);


      // Initialize sending process
      this.currentSendingProcess = {
        guests,
        progress: {
          totalGuests: guests.length,
          currentGuest: 0,
          successCount: 0,
          errorCount: 0,
          currentGuestName: '',
          isComplete: false
        },
        results: []
      };


      // Send progress update to popup
      this.broadcastProgress();

      // Process each guest
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        
        // Update current progress
        this.currentSendingProcess.progress.currentGuest = i + 1;
        this.currentSendingProcess.progress.currentGuestName = guest.fullName;
        this.broadcastProgress();

        // Send to individual guest
        const result = await this.sendToSingleGuest(guest);
        this.currentSendingProcess.results.push(result);

        // Update counters
        if (result.success) {
          this.currentSendingProcess.progress.successCount++;
          
          // Update Google Sheets status
          try {
            await this.updateSheetStatus(guest.rowNumber.toString(), 'Invite Sent (WA)');
          } catch (error) {
            Logger.error(`Failed to update sheet status for ${guest.fullName}`, error as Error);
          }
        } else {
          this.currentSendingProcess.progress.errorCount++;
        }

        // Add delay between sends to avoid rate limiting
        if (i < guests.length - 1) {
          await this.delay(this.SEND_DELAY);
        }
      }

      // Mark as complete
      this.currentSendingProcess.progress.isComplete = true;
      this.currentSendingProcess.progress.currentGuestName = '';
      this.broadcastProgress();

      // Send completion message
      this.broadcastMessage({
        type: 'SENDING_COMPLETE',
        payload: {
          results: this.currentSendingProcess.results,
          summary: {
            total: guests.length,
            successful: this.currentSendingProcess.progress.successCount,
            failed: this.currentSendingProcess.progress.errorCount
          }
        }
      });

      Logger.info(`Bulk sending completed: ${this.currentSendingProcess.progress.successCount}/${guests.length} successful`);

    } catch (error) {
      Logger.error('Bulk sending process failed', error as Error);
      
      // Broadcast error
      this.broadcastMessage({
        type: 'SENDING_COMPLETE',
        payload: {
          error: (error as Error).message,
          results: this.currentSendingProcess?.results || []
        }
      });

      throw error;
    } finally {
      // Clear IndexedDB after bulk operation completes
      try {
        await ceremonyStorage.clearAll();
        Logger.info('[CEREMONY CACHE] Cleared all ceremony videos from storage');
      } catch (error) {
        Logger.error('[CEREMONY CACHE] Failed to clear storage:', error as Error);
      }
      
      this.currentSendingProcess = null;
    }
  }

  /**
   * Send invitation to a single guest
   */
  async sendToSingleGuest(guest: Guest): Promise<SendResult> {
    const timestamp = Date.now();
    let textSent = false;
    let videosSent = true;
    
    try {
      Logger.info(`[WA DEBUG] ===== Starting send to ${guest.fullName} =====`);
      Logger.info(`[WA DEBUG] Guest details: ${JSON.stringify({
        fullName: guest.fullName,
        phone: guest.whatsappNumber,
        pengajian: guest.pengajian,
        siraman: guest.siraman,
        akadNikah: guest.akadNikah,
        syukuran: guest.syukuran
      })}`);
      
      // Open chat and send text message
      Logger.info(`[WA DEBUG] Processing action: OPEN_CHAT`);
      await this.sendMessageToWhatsAppTab('OPEN_CHAT', {
        whatsappInviteLink: guest.whatsappInviteLink
      });
      
      Logger.info(`[WA DEBUG] Processing action: SEND_MESSAGE`);
      const messageResult = await this.sendMessageToWhatsAppTab('SEND_MESSAGE', {
        message: guest.invitationMessage
      });
      
      textSent = messageResult === true;
      Logger.info(`[WA DEBUG] Text message sent: ${textSent}`);
      
      // Send ceremony videos if text was successful
      if (textSent) {
        const requiredVideos = await this.getRequiredVideosForGuest(guest);
        
        if (requiredVideos.length > 0) {
          Logger.info(`[WA DEBUG] Preparing to send ${requiredVideos.length} videos`);
          
          videosSent = await this.sendMessageToWhatsAppTab('SEND_VIDEOS', {
            videos: requiredVideos
          });
          
          Logger.info(`[WA DEBUG] Videos sent: ${videosSent}`);
        } else {
          Logger.info(`[WA DEBUG] No ceremony videos required for ${guest.fullName}`);
        }
      }
      
      // Determine RSVP status based on success
      let rsvpStatus: string;
      if (textSent && videosSent) {
        rsvpStatus = 'Invite Sent (WA)';
      } else if (textSent && !videosSent) {
        rsvpStatus = 'Needs FU'; // Text sent but videos failed
      } else {
        rsvpStatus = 'Needs Invite (WA)'; // Keep original if text failed
      }
      
      // Update sheet status if text was sent
      if (textSent) {
        try {
          const updateResult = await messageHandler.handleMessage(
            {
              type: 'UPDATE_SHEET_STATUS',
              payload: { 
                rowNumber: guest.rowNumber, 
                status: rsvpStatus 
              }
            },
            { id: 'whatsapp-coordinator' }
          );
          
          if (updateResult.success) {
            Logger.info(`[WA DEBUG] RSVP status updated to: ${rsvpStatus}`);
          } else {
            Logger.error(`[WA DEBUG] Sheet update failed: ${updateResult.error}`);
          }
        } catch (sheetError) {
          Logger.error(`[WA DEBUG] Failed to update sheet: ${(sheetError as Error).message}`);
        }
      }
      
      // Wait before closing tab
      await this.delay(2000);
      await this.closeWhatsAppTab();
      
      return {
        success: textSent,
        guestName: guest.fullName,
        phoneNumber: guest.whatsappNumber,
        videosSent,
        timestamp
      };
      
    } catch (error) {
      Logger.error(`Failed to send invitation to ${guest.fullName}`, error as Error);
      await this.closeWhatsAppTab();
      
      return {
        success: false,
        guestName: guest.fullName,
        phoneNumber: guest.whatsappNumber,
        videosSent: false,
        error: (error as Error).message,
        timestamp
      };
    }
  }

  /**
   * Update guest RSVP status in Google Sheets
   */
  async updateSheetStatus(guestId: string, status: string): Promise<void> {
    try {
      // Send message to background script to update sheets
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SHEET_STATUS',
        payload: {
          rowNumber: parseInt(guestId),
          status: status
        }
      });

      Logger.info(`Updated sheet status for row ${guestId} to ${status}`);
    } catch (error) {
      Logger.error(`Failed to update sheet status for row ${guestId}`, error as Error);
      throw error;
    }
  }

  /**
   * Handle sending progress updates
   */
  handleSendingProgress(progress: SendProgress): void {
    if (this.currentSendingProcess) {
      this.currentSendingProcess.progress = progress;
      this.broadcastProgress();
    }
  }

  /**
   * Download and store unique ceremony files in IndexedDB
   * This survives service worker restarts during long operations
   */
  private async downloadAndStoreCeremonies(guests: Guest[]): Promise<void> {
    Logger.info(`[CEREMONY CACHE] Starting ceremony file download and storage`);
    
    // Get unique ceremony IDs needed
    const uniqueCeremonies = new Set<string>();
    guests.forEach(guest => {
      if (guest.pengajian) uniqueCeremonies.add('pengajian');
      if (guest.siraman) uniqueCeremonies.add('siraman');
      if (guest.akadNikah) uniqueCeremonies.add('akadNikah');
      if (guest.syukuran) uniqueCeremonies.add('syukuran');
    });

    Logger.info(`[CEREMONY CACHE] Unique ceremonies needed: ${Array.from(uniqueCeremonies).join(', ')}`);

    // Get ceremony configuration from storage
    const result = await chrome.storage.local.get(['eventCeremonies']);
    const ceremonies: Array<Ceremony> = result.eventCeremonies || [];
    
    if (ceremonies.length === 0) {
      Logger.error('[CEREMONY CACHE] No ceremony configuration found! Run ceremony setup first.');
      return;
    }
    
    Logger.info(`[CEREMONY CACHE] Found ${ceremonies.length} configured ceremonies`);

    // Download and store each unique ceremony
    let downloadCount = 0;
    let skipCount = 0;
    
    for (const ceremonyId of uniqueCeremonies) {
      // Check if already in IndexedDB
      const exists = await ceremonyStorage.hasVideo(ceremonyId);
      if (exists) {
        Logger.info(`[CEREMONY CACHE] ${ceremonyId} already in storage, skipping download`);
        skipCount++;
        continue;
      }
      
      const ceremony = ceremonies.find(c => c.id === ceremonyId);
      
      if (!ceremony) {
        Logger.error(`[CEREMONY CACHE] Ceremony "${ceremonyId}" not found in configuration`);
        continue;
      }
      
      if (!ceremony.driveFileId) {
        Logger.error(`[CEREMONY CACHE] Ceremony ${ceremony.name} has no Drive file ID`);
        continue;
      }
      
      try {
        Logger.info(`[CEREMONY CACHE] Downloading: ${ceremony.name} (Drive ID: ${ceremony.driveFileId})`);
        
        // Download directly from Drive service
        const blob = await driveService.downloadFile(ceremony.driveFileId);
        
        // Store in IndexedDB
        await ceremonyStorage.storeVideo(ceremonyId, blob);
        
        Logger.info(`[CEREMONY CACHE] ✓ Stored ${ceremony.name} (${blob.size} bytes)`);
        downloadCount++;
        
      } catch (error) {
        Logger.error(`[CEREMONY CACHE] Failed to download/store ${ceremony.name}:`, error as Error);
      }
    }
    
    Logger.info(`[CEREMONY CACHE] Download complete: ${downloadCount} new, ${skipCount} cached`);
  }

  /**
   * Get required ceremony videos for a guest from IndexedDB
   */
  private async getRequiredVideosForGuest(guest: Guest): Promise<Array<{filename: string, blob: Blob}>> {
    const videos: Array<{filename: string, blob: Blob}> = [];
    
    Logger.info(`[CEREMONY CACHE] Getting videos for ${guest.fullName}`);
    
    // Define ceremony mappings
    const ceremonyMappings = [
      { flag: guest.pengajian, id: 'pengajian', filename: 'Pengajian_Invitation.mp4' },
      { flag: guest.siraman, id: 'siraman', filename: 'Siraman_Invitation.mp4' },
      { flag: guest.akadNikah, id: 'akadNikah', filename: 'AkadNikah_Invitation.mp4' },
      { flag: guest.syukuran, id: 'syukuran', filename: 'Syukuran_Invitation.mp4' }
    ];
    
    for (const ceremony of ceremonyMappings) {
      if (ceremony.flag) {
        try {
          const blob = await ceremonyStorage.getVideo(ceremony.id);
          
          if (blob) {
            videos.push({ filename: ceremony.filename, blob });
            Logger.info(`[CEREMONY CACHE] ✓ Retrieved ${ceremony.id} (${blob.size} bytes)`);
          } else {
            Logger.error(`[CEREMONY CACHE] Guest needs ${ceremony.id} but not found in storage!`);
          }
        } catch (error) {
          Logger.error(`[CEREMONY CACHE] Error retrieving ${ceremony.id}:`, error as Error);
        }
      }
    }
    
    Logger.info(`[CEREMONY CACHE] Prepared ${videos.length} videos for ${guest.fullName}`);
    return videos;
  }



  /**
   * Send message to WhatsApp Web content script
   */
  private async sendMessageToWhatsAppTab(action: string, payload: any): Promise<any> {
    try {
      Logger.info(`[WA DEBUG] Processing action: ${action}`);
      
      // For OPEN_CHAT, create new tab
      if (action === 'OPEN_CHAT' && payload.whatsappInviteLink) {
        Logger.info(`[WA DEBUG] Creating new tab for WhatsApp invite link: ${payload.whatsappInviteLink}`);
        
        const newTab = await chrome.tabs.create({
          url: payload.whatsappInviteLink,
          active: true
        });
        
        if (!newTab.id) {
          throw new Error('Failed to create WhatsApp tab');
        }
        
        this.currentSendingProcess!.whatsappTabId = newTab.id;
        
        // Wait for tab to load
        await this.delay(5000);
        Logger.info(`[WA DEBUG] WhatsApp tab created successfully: ${newTab.id}`);
        return true;
      }
      
      // For SEND_MESSAGE, send to content script
      if (action === 'SEND_MESSAGE') {
        const tabId = this.currentSendingProcess?.whatsappTabId;
        if (!tabId) {
          throw new Error('No WhatsApp tab available');
        }
        
        Logger.info(`[WA DEBUG] Sending message to tab ${tabId}`);
        
        // Send message to content script with proper error handling
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, {
            type: 'WHATSAPP_AUTOMATION',
            action: 'SEND_MESSAGE',
            message: payload.message
          }, (response) => {
            if (chrome.runtime.lastError) {
              Logger.error(`[WA DEBUG] Chrome runtime error: ${chrome.runtime.lastError.message}`);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            
            if (!response) {
              Logger.error(`[WA DEBUG] No response from content script`);
              reject(new Error('No response from content script'));
              return;
            }
            
            Logger.info(`[WA DEBUG] Content script response:`, response);
            
            if (response.success && response.data === true) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || 'Message send failed - content script returned false'));
            }
          });
        });
      }
      
      throw new Error(`Unknown action: ${action}`);
      
    } catch (error) {
      Logger.error(`[WA DEBUG] Failed to process action: ${action}`, error as Error);
      throw error;
    }
  }

  /**
   * Close the WhatsApp tab
   */
  private async closeWhatsAppTab(): Promise<void> {
    // Close the WhatsApp tab after sending
    if (this.currentSendingProcess?.whatsappTabId) {
      try {
        await chrome.tabs.remove(this.currentSendingProcess.whatsappTabId);

        // Clear the tab ID since we closed it
        this.currentSendingProcess.whatsappTabId = undefined;
        Logger.info('[WA DEBUG] WhatsApp tab closed after sending message');
      } catch (closeError) {
        Logger.warn('[WA DEBUG] Failed to close WhatsApp tab', closeError as Error);
      }
    }
  }

  /**
   * Broadcast progress updates to popup
   */
  private broadcastProgress(): void {
    if (!this.currentSendingProcess) return;

    this.broadcastMessage({
      type: 'UPDATE_PROGRESS',
      payload: this.currentSendingProcess.progress
    });
  }

  /**
   * Broadcast message to all extension contexts
   */
  private broadcastMessage(message: WhatsAppMessage): void {
    // Send to popup if open
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup might not be open, ignore error
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const whatsappCoordinator = new WhatsAppCoordinatorImpl();

// Handle messages from popup and other contexts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_BULK_WHATSAPP_SEND') {
    handleBulkSendRequest(message.payload.guests, sendResponse);
    return true; // Keep message channel open
  }

  if (message.type === 'GET_SENDING_STATUS') {
    // Return current sending status
    sendResponse({
      success: true,
      data: whatsappCoordinator['currentSendingProcess']?.progress || null
    });
    return false;
  }
});

async function handleBulkSendRequest(guests: Guest[], sendResponse: (response: any) => void) {
  try {
    await whatsappCoordinator.startBulkSending(guests);
    sendResponse({ success: true });
  } catch (error) {
    Logger.error('Bulk send request failed', error as Error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}
