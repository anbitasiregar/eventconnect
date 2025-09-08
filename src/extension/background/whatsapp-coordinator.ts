/**
 * WhatsApp Coordinator - Background Script
 * Orchestrates the bulk WhatsApp invitation sending process
 */

import { Guest, SendProgress, SendResult, WhatsAppCoordinator, WhatsAppMessage } from '../shared/whatsapp-types';
import { Logger } from '../shared/logger';

class WhatsAppCoordinatorImpl implements WhatsAppCoordinator {
  private currentSendingProcess: {
    guests: Guest[];
    progress: SendProgress;
    results: SendResult[];
    whatsappTabId?: number;
  } | null = null;

  private readonly RETRY_ATTEMPTS = 3;
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

      /*
      // Ensure WhatsApp Web is open and ready
      const tabReady = await this.ensureWhatsAppTabReady();
      if (!tabReady) {
        throw new Error('WhatsApp Web is not ready. Please open WhatsApp Web and login.');
      }
      */

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
    const startTime = Date.now();
    let lastError: string | undefined;

    Logger.info(`Attempting to send invitation to ${guest.fullName}`);

    // Retry logic
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        Logger.info(`Send attempt ${attempt}/${this.RETRY_ATTEMPTS} for ${guest.fullName}`);

        /*
        // Ensure we have WhatsApp tab
        if (!this.currentSendingProcess?.whatsappTabId) {
          throw new Error('WhatsApp tab not available');
        }
        */
        // Open chat with contact
        const chatOpened = await this.sendMessageToWhatsAppTab('OPEN_CHAT', {
          phoneNumber: guest.whatsappInviteLink
        });

        if (!chatOpened) {
          throw new Error('Failed to open chat with contact');
        }

        // Send the invitation message
        const messageSent = await this.sendMessageToWhatsAppTab('SEND_MESSAGE', {
          message: guest.invitationMessage
        });

        if (!messageSent) {
          throw new Error('Failed to send message');
        }

        // Success!
        const result: SendResult = {
          success: true,
          guestName: guest.fullName,
          phoneNumber: guest.whatsappNumber,
          timestamp: Date.now()
        };

        Logger.info(`Successfully sent invitation to ${guest.fullName}`);
        return result;

      } catch (error) {
        lastError = (error as Error).message;
        Logger.warn(`Send attempt ${attempt} failed for ${guest.fullName}: ${lastError}`);

        // Wait before retry (except on last attempt)
        if (attempt < this.RETRY_ATTEMPTS) {
          await this.delay(2000);
        }
      }
    }

    // All attempts failed
    const result: SendResult = {
      success: false,
      guestName: guest.fullName,
      phoneNumber: guest.whatsappNumber,
      error: lastError || 'Unknown error',
      timestamp: Date.now()
    };

    Logger.error(`Failed to send invitation to ${guest.fullName} after ${this.RETRY_ATTEMPTS} attempts`);
    return result;
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
   * Ensure WhatsApp Web tab is open and ready
   */
  // delete this function if bug is fixed
  private async ensureWhatsAppTabReady(): Promise<boolean> {
    try {
      // Check if WhatsApp Web tab already exists
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      let whatsappTab = tabs.find(tab => tab.id);
      if (!whatsappTab) {
        /*
        // Create new WhatsApp Web tab
        Logger.info('Creating new WhatsApp Web tab');
        whatsappTab = await chrome.tabs.create({
          url: 'https://web.whatsapp.com',
          active: true
        });
        */
        throw new Error('No WhatsApp Web tab found');
      } else {
        // Focus existing tab
        Logger.info('Focusing existing WhatsApp Web tab');
        await chrome.tabs.update(whatsappTab.id!, { active: true });
      }

      if (!whatsappTab.id) {
        throw new Error('Failed to create/access WhatsApp Web tab');
      }

      this.currentSendingProcess!.whatsappTabId = whatsappTab.id;

      // Wait for tab to load and WhatsApp to be ready
      await this.delay(3000);

      // Check if WhatsApp is ready
      const isReady = await this.sendMessageToWhatsAppTab('IS_READY', {});
      
      if (!isReady) {
        Logger.warn('WhatsApp Web is not ready - user may need to login');
        return false;
      }

      Logger.info('WhatsApp Web is ready for automation');
      return true;

    } catch (error) {
      Logger.error('Failed to ensure WhatsApp tab ready', error as Error);
      return false;
    }
  }

  /**
   * Send message to WhatsApp Web content script
   */
  private async sendMessageToWhatsAppTab(action: string, payload: any): Promise<any> {
    if (!this.currentSendingProcess?.whatsappTabId) {
      throw new Error('WhatsApp tab not available');
    }

    try {
      Logger.info(`[WA DEBUG] Sending message to tab ${this.currentSendingProcess.whatsappTabId}: ${action}`);
      
      // Check if tab still exists before sending message
      try {
        const tab = await chrome.tabs.get(this.currentSendingProcess.whatsappTabId);
        if (!tab || tab.status !== 'complete') {
          Logger.warn('[WA DEBUG] Tab not ready or doesn\'t exist, recreating...');
          const tabReady = await this.ensureWhatsAppTabReady();
          if (!tabReady) {
            throw new Error('Failed to recreate WhatsApp tab');
          }
        }
      } catch (tabError) {
        Logger.warn('[WA DEBUG] Tab check failed, attempting to recreate', tabError as Error);
        const tabReady = await this.ensureWhatsAppTabReady();
        if (!tabReady) {
          throw new Error('Failed to recreate WhatsApp tab');
        }
      }
      
      // Add timeout to prevent hanging
      const messagePromise = chrome.tabs.sendMessage(
        this.currentSendingProcess.whatsappTabId,
        {
          type: 'WHATSAPP_AUTOMATION',
          action: action,
          ...payload
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message timeout after 15 seconds')), 15000);
      });
      
      const response = await Promise.race([messagePromise, timeoutPromise]);

      if (!response.success) {
        throw new Error(response.error || 'WhatsApp automation failed');
      }

      Logger.info(`[WA DEBUG] Message response received: ${response.success}`);
      return response.data;
    } catch (error) {
      const errorMsg = (error as Error).message;
      Logger.error(`[WA DEBUG] Failed to send message to WhatsApp tab: ${action}`, error as Error);
      
      // If it's a connection error, try to recreate the tab once
      if (errorMsg.includes('Receiving end does not exist') || 
          errorMsg.includes('message channel closed') ||
          errorMsg.includes('Message timeout')) {
        Logger.info('[WA DEBUG] Tab seems to have crashed, attempting recovery...');
        
        try {
          const tabReady = await this.ensureWhatsAppTabReady();
          if (tabReady) {
            Logger.info('[WA DEBUG] Tab recovered, retrying message once...');
            // Retry once after tab recovery
            const retryResponse = await chrome.tabs.sendMessage(
              this.currentSendingProcess.whatsappTabId!,
              {
                type: 'WHATSAPP_AUTOMATION',
                action: action,
                ...payload
              }
            );
            
            if (retryResponse.success) {
              return retryResponse.data;
            }
          }
        } catch (recoveryError) {
          Logger.error('[WA DEBUG] Tab recovery failed', recoveryError as Error);
        }
      }
      
      throw error;
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
