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
   * Check if WhatsApp Web is ready for automation
   */
  async isWhatsAppReady(): Promise<boolean> {
    try {
      Logger.info('Checking WhatsApp Web readiness');
      
      // Check if we're on WhatsApp Web
      if (!window.location.hostname.includes('web.whatsapp.com')) {
        Logger.warn('Not on WhatsApp Web domain');
        return false;
      }

      // Check for main interface elements
      const searchBox = await this.waitForElement(SELECTORS.searchBox, 5000);
      const contactList = await this.waitForElement(SELECTORS.contactList, 5000);
      
      if (!searchBox || !contactList) {
        Logger.warn('WhatsApp Web main interface not found');
        return false;
      }

      // Check if logged in (no QR code present)
      const qrCode = document.querySelector('[data-testid="qr-code"]');
      if (qrCode) {
        Logger.warn('WhatsApp Web showing QR code - user needs to login');
        return false;
      }

      Logger.info('WhatsApp Web is ready for automation');
      return true;
    } catch (error) {
      Logger.error('Error checking WhatsApp Web readiness', error as Error);
      return false;
    }
  }

  /**
   * Search for a contact by phone number
   */
  async searchContact(phoneNumber: string): Promise<boolean> {
    try {
      Logger.info(`Searching for contact: ${phoneNumber}`);
      
      // Clean phone number
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      
      // Find and click search box
      const searchBox = await this.waitForElement(SELECTORS.searchBox);
      if (!searchBox) {
        throw new Error('Search box not found');
      }

      await this.clickElement(searchBox);
      await this.delay(500);

      // Find search input and enter phone number
      const searchInput = await this.waitForElement(SELECTORS.searchInput);
      if (!searchInput) {
        throw new Error('Search input not found');
      }

      await this.clearAndTypeText(searchInput, cleanNumber);
      await this.delay(2000); // Wait for search results

      // Check if contact found
      const contactFound = await this.waitForElement(SELECTORS.chatItem, 3000);
      
      if (!contactFound) {
        Logger.warn(`Contact not found for phone number: ${phoneNumber}`);
        return false;
      }

      Logger.info(`Contact found for: ${phoneNumber}`);
      return true;
    } catch (error) {
      Logger.error(`Error searching for contact ${phoneNumber}`, error as Error);
      return false;
    }
  }

  /**
   * Open chat with a contact
   */
  async openChat(phoneNumber: string): Promise<boolean> {
    try {
      Logger.info(`Opening chat with: ${phoneNumber}`);
      
      // First search for contact
      const contactFound = await this.searchContact(phoneNumber);
      if (!contactFound) {
        return false;
      }

      // Click on the contact
      const chatItem = await this.waitForElement(SELECTORS.chatItem);
      if (!chatItem) {
        throw new Error('Chat item not found');
      }

      await this.clickElement(chatItem);
      await this.delay(1000);

      // Verify chat is open
      const messageBox = await this.waitForElement(SELECTORS.messageBox, 5000);
      if (!messageBox) {
        Logger.error(`Failed to open chat with: ${phoneNumber}`);
        return false;
      }

      Logger.info(`Successfully opened chat with: ${phoneNumber}`);
      return true;
    } catch (error) {
      Logger.error(`Error opening chat with ${phoneNumber}`, error as Error);
      return false;
    }
  }

  /**
   * Send a message in the current chat
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      Logger.info('Sending message');
      
      // Find message input box
      const messageBox = await this.waitForElement(SELECTORS.messageBox);
      if (!messageBox) {
        throw new Error('Message box not found');
      }

      // Clear existing text and type message
      await this.clearAndTypeText(messageBox, message);
      await this.delay(500);

      // Find and click send button
      const sendButton = await this.waitForElement(SELECTORS.sendButton);
      if (!sendButton) {
        throw new Error('Send button not found');
      }

      await this.clickElement(sendButton);
      await this.delay(1000);

      // Verify message was sent
      const success = await this.detectSendSuccess();
      
      if (success) {
        Logger.info('Message sent successfully');
      } else {
        Logger.error('Message send failed');
      }

      return success;
    } catch (error) {
      Logger.error('Error sending message', error as Error);
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

  /**
   * Get the current chat contact name
   */
  async getCurrentChat(): Promise<string | null> {
    try {
      const chatHeader = await this.waitForElement(SELECTORS.chatHeader, 2000);
      if (!chatHeader) {
        return null;
      }

      const contactName = chatHeader.querySelector('span[title]');
      return contactName?.getAttribute('title') || null;
    } catch (error) {
      Logger.error('Error getting current chat', error as Error);
      return null;
    }
  }

  // Utility methods

  private async waitForElement(selector: string, timeout: number = this.WAIT_TIMEOUT): Promise<Element | null> {
    return new Promise((resolve) => {
      const selectors = selector.split(', ');
      let element: Element | null = null;
      
      // Try each selector
      for (const sel of selectors) {
        element = document.querySelector(sel.trim());
        if (element) {
          resolve(element);
          return;
        }
      }

      // If not found, wait for it
      const observer = new MutationObserver(() => {
        for (const sel of selectors) {
          element = document.querySelector(sel.trim());
          if (element) {
            observer.disconnect();
            resolve(element);
            return;
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
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

  private async clearAndTypeText(element: Element, text: string): Promise<void> {
    if (element instanceof HTMLElement) {
      // For contenteditable elements
      if (element.contentEditable === 'true') {
        element.focus();
        element.innerText = '';
        
        // Simulate typing
        element.innerText = text;
        
        // Trigger input events
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
      } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // For regular input elements
        element.focus();
        element.value = '';
        element.value = text;
        
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
      }
    }
  }

  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize automation when script loads
const whatsappAutomation = new WhatsAppAutomationImpl();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WHATSAPP_AUTOMATION') {
    handleAutomationMessage(message, sendResponse);
    return true; // Keep message channel open for async response
  }
});

async function handleAutomationMessage(message: any, sendResponse: (response: any) => void) {
  try {
    switch (message.action) {
      case 'IS_READY':
        const isReady = await whatsappAutomation.isWhatsAppReady();
        sendResponse({ success: true, data: isReady });
        break;

      case 'SEARCH_CONTACT':
        const found = await whatsappAutomation.searchContact(message.phoneNumber);
        sendResponse({ success: true, data: found });
        break;

      case 'OPEN_CHAT':
        const opened = await whatsappAutomation.openChat(message.phoneNumber);
        sendResponse({ success: true, data: opened });
        break;

      case 'SEND_MESSAGE':
        const sent = await whatsappAutomation.sendMessage(message.message);
        sendResponse({ success: true, data: sent });
        break;

      case 'GET_CURRENT_CHAT':
        const currentChat = await whatsappAutomation.getCurrentChat();
        sendResponse({ success: true, data: currentChat });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    Logger.error('WhatsApp automation error', error as Error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

Logger.info('WhatsApp automation content script loaded');
