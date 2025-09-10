/**
 * WhatsApp Coordinator - Background Script
 * Orchestrates the bulk WhatsApp invitation sending process
 */

import { Guest, SendProgress, SendResult, WhatsAppCoordinator, WhatsAppMessage } from '../shared/whatsapp-types';
import { Logger } from '../shared/logger';
import { messageHandler } from './service-worker';

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
      this.currentSendingProcess = null;
    }
  }

  /**
   * Send invitation to a single guest
   */
  async sendToSingleGuest(guest: Guest): Promise<SendResult> {
    const timestamp = Date.now();
    
    try {
      Logger.info(`Attempting to send invitation to ${guest.fullName}`);
      
      // Open chat with invite link
      await this.sendMessageToWhatsAppTab('OPEN_CHAT', {
        whatsappInviteLink: guest.whatsappInviteLink
      });
      
      // Send message
      const messageResult = await this.sendMessageToWhatsAppTab('SEND_MESSAGE', {
        message: guest.invitationMessage
      });
      
      Logger.info(`[WA DEBUG] Message send result: ${messageResult}`);
      
      // Only update sheets if message actually sent
      if (messageResult === true) {
        // Use the existing, properly initialized messageHandler
        try {
          const updateResult = await messageHandler.handleMessage(
            {
              type: 'UPDATE_SHEET_STATUS',
              payload: { 
                rowNumber: guest.rowNumber, 
                status: 'Invite Sent (WA)' 
              }
            },
            { id: 'whatsapp-coordinator' } // Add the required sender parameter
          );
          
          if (updateResult.success) {
            Logger.info(`[WA DEBUG] Sheet status updated for ${guest.fullName}`);
          } else {
            Logger.error(`[WA DEBUG] Sheet update failed: ${updateResult.error}`);
          }
        } catch (sheetError) {
          Logger.error(`[WA DEBUG] Failed to update sheet: ${(sheetError as Error).message}`);
        }
      }
      
      // Wait before closing tab
      await this.delay(3000);
      await this.closeWhatsAppTab();
      
      return {
        success: messageResult === true,
        guestName: guest.fullName,
        phoneNumber: guest.whatsappNumber,
        timestamp
      };
      
    } catch (error) {
      Logger.error(`Failed to send invitation to ${guest.fullName}`, error as Error);
      await this.closeWhatsAppTab();
      
      return {
        success: false,
        guestName: guest.fullName,
        phoneNumber: guest.whatsappNumber,
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
