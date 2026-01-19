/**
 * WhatsApp Web Content Script for EventConnect
 * Handles DOM automation for bulk invitation sending
 */

import { WhatsAppAutomation, WhatsAppSelectors, WhatsAppError } from '../shared/whatsapp-types';
import { Logger } from '../shared/logger';

// WhatsApp Web selectors with fallbacks
const SELECTORS: WhatsAppSelectors = {
  searchBox: '[data-testid="chat-list-search"], [title="Search input textbox"], [data-tab="3"]',
  searchInput: '[data-testid="chat-list-search"] div[contenteditable="true"], #side div[contenteditable="true"]',
  chatItem: '[data-testid="list-item-"] span[title], [data-testid="cell-frame-container"] span[title]',
  messageBox: '[data-testid="conversation-compose-box-input"], div[contenteditable="true"][data-tab="10"]',
  sendButton: '[data-testid="compose-btn-send"], [data-testid="send"], button[data-tab="11"]',
  messageStatus: '[data-testid="msg-check"], [data-testid="msg-dblcheck"], [data-icon="msg-check"]',
  contactList: '[data-testid="chat-list"], #pane-side',
  chatHeader: '[data-testid="conversation-header"], header[data-testid="chat-header"]'
};

class WhatsAppAutomationImpl implements WhatsAppAutomation {
  private readonly WAIT_TIMEOUT = 10000; // 10 seconds
  private readonly ACTION_DELAY = 2000; // 2 seconds between actions
  private readonly RETRY_COUNT = 3;

  /**
   * Open chat with a contact
   */
  async openChat(whatsappInviteLink: string): Promise<boolean> {
    return await this.openChatDirectURL(whatsappInviteLink);
  }

  /**
   * Send a message in the current chat (simplified for invite link flow)
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      // Wait for WhatsApp Web to fully load and populate the message
      await this.delay(5000);
      
      // Verify message box has content (optional check)
      const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
      
      // Find send button with multiple selectors
      const sendSelectors = [
        '[data-testid="compose-btn-send"]',
        '[data-testid="send-button"]', 
        'button[aria-label="Send"]',
        '.selectable-text[aria-label="Send"]',
        '[data-icon="send"]',
        'span[data-icon="send"]'
      ];
      
      let sendButton = null;
      for (const selector of sendSelectors) {
        sendButton = document.querySelector(selector);
        if (sendButton) {
          Logger.info(`[WA DEBUG] Send button found with selector: ${selector}`);
          break;
        }
      }
      
      if (!sendButton) {
        Logger.info('[WA DEBUG] Send button not found. Available buttons: ' + 
          Array.from(document.querySelectorAll('button')).map(b => b.outerHTML.substring(0, 100)).join(', ')
        );
        return false;
      }

      await this.clickElement(sendButton);
      
      // Wait a moment to confirm send
      await this.delay(2000);
  
      return true;
      
    } catch (error) {
      Logger.error('[WA DEBUG] Error in sendMessage:', error as Error);
      return false;
    }
  }

  /**
   * Detect if message was sent successfully
   */
  async detectSendSuccess(): Promise<boolean> {
    try {
      // Wait for message status indicators
      await this.delay(2000);
      
      // Look for sent/delivered indicators
      const messageStatus = document.querySelector(SELECTORS.messageStatus);
      
      // Check if message appears in chat
      const messages = document.querySelectorAll('[data-testid="msg-container"]');
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) {
        Logger.warn('No messages found in chat');
        return false;
      }

      // Check for error indicators
      const errorIcon = lastMessage.querySelector('[data-icon="msg-time"], [data-icon="msg-retry"]');
      if (errorIcon) {
        Logger.warn('Message send error detected');
        return false;
      }

      // If we have status indicators or the message is visible, consider it sent
      return messageStatus !== null || lastMessage !== null;
    } catch (error) {
      Logger.error('Error detecting send success', error as Error);
      return false;
    }
  }

  // Utility methods

  private async waitForElement(selector: string, timeout: number = this.WAIT_TIMEOUT): Promise<Element | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const selectors = selector.split(', ');
      
      Logger.info(`[WA DEBUG] Waiting for element with selectors: ${selectors.join(' OR ')}`);
      
      const checkElement = () => {
        // Try each selector
        for (const sel of selectors) {
          const element = document.querySelector(sel.trim());
          if (element) {
            Logger.info(`[WA DEBUG] Element found with selector: ${sel.trim()}`);
            resolve(element);
            return;
          }
        }
        
        // Check timeout
        if (Date.now() - startTime > timeout) {
          Logger.warn(`[WA DEBUG] Element timeout after ${timeout}ms for selectors: ${selectors.join(', ')}`);
          resolve(null);
          return;
        }
        
        // Continue checking
        setTimeout(checkElement, 500);
      };
      
      checkElement();
    });
  }

  private async clickElement(element: Element): Promise<void> {
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      // Fallback for non-HTMLElements
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    }
  }
 
  /**
   * Check if tab is stable and responsive
   */
  private isTabStable(): boolean {
    try {
      // Check if basic WhatsApp elements are present
      const app = document.querySelector('#app');
      const side = document.querySelector('#side');
      
      // Check if page is not in loading state
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .spinner');
      
      return !!(app && side && loadingElements.length === 0);
    } catch (error) {
      Logger.warn('[WA DEBUG] Tab stability check failed', error as Error);
      return false;
    }
  }

  /**
   * Gentle click method that's less likely to crash WhatsApp Web
   */
  private async gentleClickElement(element: Element): Promise<void> {
    try {
      Logger.info('[WA DEBUG] Using gentle click method');
      
      // Scroll element into view first
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(500);
      }
      
      // Try focus + Enter key first (gentlest method)
      if (element instanceof HTMLElement) {
        element.focus();
        await this.delay(200);
        
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        element.dispatchEvent(enterEvent);
        await this.delay(1000);
        
        // Check if it worked
        if (this.isTabStable()) {
          Logger.info('[WA DEBUG] Gentle click (Enter key) successful');
          return;
        }
      }
      
      // Fallback to standard click
      Logger.info('[WA DEBUG] Trying standard click as fallback');
      if (element instanceof HTMLElement) {
        element.click();
      }
      
    } catch (error) {
      Logger.error('[WA DEBUG] Gentle click failed', error as Error);
      throw error;
    }
  }

  /**
   * Direct URL method for opening chats (most reliable fallback)
   */
  private async openChatDirectURL(whatsappInviteLink: string): Promise<boolean> {
    try {
      Logger.info(`[WA DEBUG] Using direct URL method for: ${whatsappInviteLink}`);    

      // Use location.replace to avoid history issues
      window.location.replace(whatsappInviteLink);
      
     return true;
    } catch (error) {
      Logger.error('[WA DEBUG] Direct URL method failed', error as Error);
      return false;
    }
  }

  /**
   * Send video file as separate message
   */
  async sendVideo(videoBlob: Blob, filename: string): Promise<boolean> {
    try {
      Logger.info(`[WA DEBUG] Sending video: ${filename} (${videoBlob.size} bytes)`);
      
      await this.delay(2000);
      
      // Find attachment clip button
      const attachButton = document.querySelector('[data-testid="compose-btn-attach"]') ||
                          document.querySelector('[data-testid="clip"]') ||
                          document.querySelector('[title*="Attach"]') ||
                          document.querySelector('[aria-label*="Attach"]');
      
      if (!attachButton) {
        Logger.error('[WA DEBUG] Attachment button not found');
        return false;
      }
      
      Logger.info('[WA DEBUG] Found attachment button, clicking...');
      await this.clickElement(attachButton);
      await this.delay(1000);
      
      // Click "Photos & videos" option from the menu
      console.log('[WA VIDEO] Looking for Photos & videos option...');
      
      const photosVideoButton = document.querySelector('[data-testid="mi-attach-media"]') ||
                                Array.from(document.querySelectorAll('li, button, div[role="button"]')).find(el => 
                                  el.textContent?.toLowerCase().includes('photo') && 
                                  el.textContent?.toLowerCase().includes('video')
                                );
      
      if (!photosVideoButton) {
        console.error('[WA VIDEO] Photos & videos button not found');
        return false;
      }
      
      console.log('[WA VIDEO] Clicking Photos & videos...');
      await this.clickElement(photosVideoButton);
      await this.delay(500);
      
      // Now find the file input (appears after clicking Photos & videos)
      const fileInput = document.querySelector('input[type="file"][accept*="image"],input[type="file"][accept*="video"]') as HTMLInputElement;
      
      if (!fileInput) {
        console.error('[WA VIDEO] File input not found after clicking Photos & videos');
        return false;
      }
      
      console.log('[WA VIDEO] Found file input, creating file...');
      
      // DIAGNOSTIC: Check blob properties
      console.log('[WA VIDEO] Blob type:', videoBlob.type);
      console.log('[WA VIDEO] Blob size:', videoBlob.size);
      
      // Create a test URL to verify blob is valid
      const testUrl = URL.createObjectURL(videoBlob);
      console.log('[WA VIDEO] Blob URL (test in browser):', testUrl);
      // Don't revoke yet - we'll use the blob
      
      // Ensure blob has video/mp4 type and proper .mp4 extension
      const typedBlob = new Blob([videoBlob], { type: 'video/mp4' });
      
      // Ensure filename ends with .mp4
      const mp4Filename = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;
      
      const file = new File([typedBlob], mp4Filename, { 
        type: 'video/mp4',
        lastModified: Date.now()
      });
      
      console.log('[WA VIDEO] File created:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Create a DataTransfer to simulate file selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      
      // Trigger change event to notify WhatsApp
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);
      
      console.log('[WA VIDEO] File attached, waiting for preview...');
      
      // Wait for the video preview/upload dialog to appear
      await this.delay(3000);
      
      // Find and click the send button in the media preview
      // Try multiple selectors as WhatsApp's UI changes
      const sendButton = document.querySelector('[data-testid="send"]') ||
                        document.querySelector('[data-icon="send"]') ||
                        document.querySelector('span[data-testid="send"]') ||
                        document.querySelector('span[data-icon="send"]') ||
                        document.querySelector('button[aria-label*="Send"]');
      
      if (!sendButton) {
        console.error('[WA VIDEO] Send button not found in media preview');
        return false;
      }
      
      console.log('[WA VIDEO] Found send button, sending video...');
      await this.clickElement(sendButton);
      
      // Wait for video to upload and send
      // 26 MB videos upload quickly
      console.log('[WA VIDEO] Waiting for video upload...');
      await this.delay(4000);
      
      console.log(`[WA VIDEO] ✓ Video sent successfully: ${filename}`);
      return true;
      
    } catch (error) {
      Logger.error('[WA DEBUG] Error sending video:', error as Error);
      return false;
    }
  }

  /**
   * Send multiple videos sequentially
   */
  async sendCeremonyVideos(videos: Array<{filename: string, blob: Blob}>): Promise<boolean> {
    try {
      Logger.info(`[WA DEBUG] Sending ${videos.length} ceremony videos`);
      
      let allSent = true;
      
      for (const video of videos) {
        Logger.info(`[WA DEBUG] Sending video: ${video.filename}`);
        const sent = await this.sendVideo(video.blob, video.filename);
        if (!sent) {
          allSent = false;
          Logger.error(`[WA DEBUG] Failed to send: ${video.filename}`);
        }
        
        // Wait between videos to avoid overwhelming WhatsApp
        await this.delay(3000);
      }
      
      Logger.info(`[WA DEBUG] Finished sending ceremony videos. Success: ${allSent}`);
      return allSent;
    } catch (error) {
      Logger.error('[WA DEBUG] Error sending ceremony videos:', error as Error);
      return false;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize automation when script loads
const whatsappAutomation = new WhatsAppAutomationImpl();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.info(`[WA DEBUG] in onMessage.addListener: message.type: ${message.type} action: ${message.action}`);
  
  if (message.type === 'WHATSAPP_AUTOMATION') {
    Logger.info(`[WA DEBUG] in onMessage.addListener going into handleAutomationMessage: message.type: ${message.type}`);
    handleAutomationMessage(message, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleAutomationMessage(message: any, sendResponse: (response: any) => void) {
  try {
    switch (message.action) {
      case 'IS_READY':
        //const isReady = await whatsappAutomation.isWhatsAppReady();
        // CAN DELETE IF THIS BUG IS FIXED
        sendResponse({ success: true, data: true });
        break;

      case 'SEARCH_CONTACT':
        // const found = await whatsappAutomation.searchContact(message.phoneNumber);
        // CAN DELETE IF THIS BUG IS FIXED
        sendResponse({ success: true, data: true });
        break;

        case 'OPEN_CHAT':
          Logger.info(`[WA DEBUG] in handleAutomationMessage: Opening chat with: ${message.whatsappInviteLink}`);
          const opened = await whatsappAutomation.openChat(message.whatsappInviteLink);
          Logger.info(`[WA DEBUG] Chat open result: ${opened}`);
          sendResponse({ success: true, data: opened });
          break;

      case 'SEND_MESSAGE':
        Logger.info(`[WA DEBUG] in handleAutomationMessage SEND_MESSAGE: Sending message: ${message.message}`);
        const sent = await whatsappAutomation.sendMessage(message.message);
        sendResponse({ success: true, data: sent });
        break;

      case 'SEND_VIDEOS':
        Logger.info(`[WA DEBUG] in handleAutomationMessage SEND_VIDEOS: Sending ${message.videos?.length || 0} videos`);
        const videosSent = await whatsappAutomation.sendCeremonyVideos(message.videos || []);
        sendResponse({ success: true, data: videosSent });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    Logger.error('WhatsApp automation error', error as Error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}