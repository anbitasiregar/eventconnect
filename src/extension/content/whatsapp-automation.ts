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
  /*
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
  */

  /**
   * Search for a contact by phone number with detailed logging
   */
  /*
  async searchContact(phoneNumber: string): Promise<boolean> {
    try {
      Logger.info(`[WA DEBUG] Starting contact search for: ${phoneNumber}`);
      
      // Clean phone number with multiple formats
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      Logger.info(`[WA DEBUG] Cleaned phone number: ${cleanNumber}`);
      
      // Log current DOM state
      const searchBoxes = document.querySelectorAll('[data-testid="chat-list-search"], [title="Search input textbox"], [data-tab="3"]');
      Logger.info(`[WA DEBUG] Found ${searchBoxes.length} search box elements`);
      
      // Find and click search box
      const searchBox = await this.waitForElement(SELECTORS.searchBox);
      if (!searchBox) {
        Logger.error('[WA DEBUG] Search box not found - checking WhatsApp Web interface state');
        this.logWhatsAppState();
        throw new Error('Search box not found');
      }

      Logger.info('[WA DEBUG] Search box found, clicking...');
      await this.clickElement(searchBox);
      await this.delay(500);

      // Find search input and enter phone number
      const searchInputs = document.querySelectorAll('[data-testid="chat-list-search"] div[contenteditable="true"], #side div[contenteditable="true"]');
      Logger.info(`[WA DEBUG] Found ${searchInputs.length} search input elements`);
      
      const searchInput = await this.waitForElement(SELECTORS.searchInput);
      if (!searchInput) {
        Logger.error('[WA DEBUG] Search input not found after clicking search box');
        throw new Error('Search input not found');
      }

      Logger.info(`[WA DEBUG] Typing phone number: ${cleanNumber}`);
      await this.clearAndTypeText(searchInput, cleanNumber);
      
      // Wait and log search progress
      Logger.info('[WA DEBUG] Waiting for search results...');
      await this.delay(3000); // Increased wait time

      // Check multiple search result selectors
      const chatItems = document.querySelectorAll('[data-testid="list-item-"] span[title], [data-testid="cell-frame-container"] span[title]');
      Logger.info(`[WA DEBUG] Found ${chatItems.length} chat items after search`);
      
      if (chatItems.length > 0) {
        Array.from(chatItems).forEach((item, index) => {
          const title = item.getAttribute('title') || item.textContent || '';
          Logger.info(`[WA DEBUG] Chat item ${index}: ${title}`);
        });
      }

      const contactFound = await this.waitForElement(SELECTORS.chatItem, 2000);
      
      if (!contactFound) {
        Logger.warn(`[WA DEBUG] Contact not found for phone number: ${phoneNumber}`);
        Logger.info('[WA DEBUG] Attempting new chat creation fallback...');
        return await this.createNewChatWithPhone(cleanNumber);
      }

      Logger.info(`[WA DEBUG] Contact found for: ${phoneNumber}`);
      return true;
    } catch (error) {
      Logger.error(`[WA DEBUG] Error searching for contact ${phoneNumber}`, error as Error);
      return false;
    }
  }
  */

  /**
   * Open chat with a contact
   */
  async openChat(whatsappInviteLink: string): Promise<boolean> {
    return await this.openChatDirectURL(whatsappInviteLink);
  }

  /**
   * Send a message in the current chat
   */
  async sendMessage(message: string): Promise<boolean> {
    try {
      Logger.info('Sending message');
      /*
      // Find message input box
      const messageBox = await this.waitForElement(SELECTORS.messageBox);
      if (!messageBox) {
        throw new Error('Message box not found');
      }

      // Clear existing text and type message
      await this.clearAndTypeText(messageBox, message);
      await this.delay(500);
      

      // use message box directly
      const messageBox = document.querySelector(SELECTORS.messageBox);
      if (!messageBox) {
        throw new Error('Message box not found');
      }
      */

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
  /*
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
  */

  /**
   * Create new chat with phone number as fallback
   */
  /*
  async createNewChatWithPhone(phoneNumber: string): Promise<boolean> {
    try {
      Logger.info(`[WA DEBUG] Attempting new chat creation for: ${phoneNumber}`);
      
      // Method 1: Try to find and click new chat button
      const newChatSelectors = [
        '[data-testid="new-chat-button"]',
        '[title="New chat"]',
        '[data-icon="new-chat-outline"]',
        'div[title="New chat"]'
      ];
      
      let newChatButton: Element | null = null;
      for (const selector of newChatSelectors) {
        newChatButton = document.querySelector(selector);
        if (newChatButton) {
          Logger.info(`[WA DEBUG] Found new chat button with selector: ${selector}`);
          break;
        }
      }
      
      if (newChatButton) {
        Logger.info('[WA DEBUG] Clicking new chat button');
        await this.clickElement(newChatButton);
        await this.delay(2000);
        
        // Try to find phone input in new chat interface
        const phoneInputSelectors = [
          '[data-testid="new-chat-phone-input"]',
          'input[type="tel"]',
          'input[placeholder*="phone"]',
          'div[contenteditable="true"][data-tab="2"]'
        ];
        
        let phoneInput: Element | null = null;
        for (const selector of phoneInputSelectors) {
          phoneInput = document.querySelector(selector);
          if (phoneInput) {
            Logger.info(`[WA DEBUG] Found phone input with selector: ${selector}`);
            break;
          }
        }
        
        if (phoneInput) {
          Logger.info(`[WA DEBUG] Entering phone number: ${phoneNumber}`);
          await this.clearAndTypeText(phoneInput, phoneNumber);
          await this.delay(2000);
          
          // Look for start chat button
          const startChatSelectors = [
            '[data-testid="start-chat-button"]',
            'button[data-testid="compose-btn-send"]',
            'span[data-icon="send"]'
          ];
          
          let startChatButton: Element | null = null;
          for (const selector of startChatSelectors) {
            startChatButton = document.querySelector(selector);
            if (startChatButton) {
              Logger.info(`[WA DEBUG] Found start chat button with selector: ${selector}`);
              break;
            }
          }
          
          if (startChatButton) {
            await this.clickElement(startChatButton);
            await this.delay(3000);
            
            // Check if chat opened
            const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
            if (messageBox) {
              Logger.info('[WA DEBUG] New chat created successfully');
              return true;
            }
          }
        }
      }
      
      // Method 2: Direct URL navigation as fallback
      Logger.info('[WA DEBUG] Trying direct URL method');
      const cleanNumber = phoneNumber.replace(/[^\d]/g, ''); // Remove all non-digits
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanNumber}`;
      
      Logger.info(`[WA DEBUG] Navigating to: ${whatsappUrl}`);
      window.location.href = whatsappUrl;
      await this.delay(5000); // Wait longer for page load
      
      // Check if message box is available
      const messageBox = await this.waitForElement('[data-testid="conversation-compose-box-input"]', 10000);
      const success = !!messageBox;
      
      Logger.info(`[WA DEBUG] Direct URL method result: ${success}`);
      return success;
      
    } catch (error) {
      Logger.error('[WA DEBUG] New chat creation failed', error as Error);
      return false;
    }
  }
  */
  /**
   * Log current WhatsApp Web interface state for debugging
   */
  /*
  private logWhatsAppState(): void {
    Logger.info('[WA DEBUG] === WhatsApp Web Interface State ===');
    
    // Check main containers
    const mainContainers = [
      '#app',
      '[data-testid="main"]',
      '#side',
      '[data-testid="chat-list"]'
    ];
    
    mainContainers.forEach(selector => {
      const element = document.querySelector(selector);
      Logger.info(`[WA DEBUG] ${selector}: ${element ? 'Found' : 'Not found'}`);
    });
    
    // Check search elements
    const searchElements = document.querySelectorAll('[data-testid*="search"], [title*="Search"], [placeholder*="Search"]');
    Logger.info(`[WA DEBUG] Search elements found: ${searchElements.length}`);
    
    // Check if logged in
    const qrCode = document.querySelector('[data-testid="qr-code"]');
    const loginElements = document.querySelectorAll('[data-testid*="qr"], [data-testid*="login"]');
    Logger.info(`[WA DEBUG] QR Code present: ${!!qrCode}`);
    Logger.info(`[WA DEBUG] Login elements: ${loginElements.length}`);
    
    // Log page title and URL
    Logger.info(`[WA DEBUG] Page title: ${document.title}`);
    Logger.info(`[WA DEBUG] Current URL: ${window.location.href}`);
  }
  */
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

  /**
   * Wait for search results to populate with better detection
   */
  /*
  private async waitForSearchResults(timeout: number = 5000): Promise<Element[]> {
    Logger.info('[WA DEBUG] Waiting for search results...');
    
    const startTime = Date.now();
    let lastCount = 0;
    
    return new Promise((resolve) => {
      const checkResults = () => {
        const results = document.querySelectorAll('[data-testid="cell-frame-container"], [data-testid="list-item-"]');
        const currentCount = results.length;
        
        Logger.info(`[WA DEBUG] Search results count: ${currentCount}`);
        
        // If results stabilized or timeout reached
        if ((currentCount > 0 && currentCount === lastCount) || Date.now() - startTime > timeout) {
          Logger.info(`[WA DEBUG] Search results stabilized at ${currentCount} items`);
          resolve(Array.from(results));
          return;
        }
        
        lastCount = currentCount;
        setTimeout(checkResults, 1000);
      };
      
      // Start checking after initial delay
      setTimeout(checkResults, 2000);
    });
  }
  */
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

  /*
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
  */
  /*
  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    return phoneNumber.replace(/[^\d+]/g, '');
    
    /*
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Log different formats for debugging
    Logger.info(`[WA DEBUG] Original number: ${phoneNumber}`);
    Logger.info(`[WA DEBUG] Cleaned number: ${cleaned}`);
    
    // If number doesn't start with +, try adding country code
    if (!cleaned.startsWith('+')) {
      // Try with +65 for Singapore (common format)
      const withCountryCode = '+65' + cleaned;
      Logger.info(`[WA DEBUG] Trying with country code: ${withCountryCode}`);
    }
    
    return cleaned;
  }
  */
 
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
      
      // Wait for page load
      //for (let i = 0; i < 20; i++) { // 10 second timeout
        //await this.delay(500);
        
        /*
        // check for message box
        const messageBox = document.querySelector('[data-testid="conversation-compose-box-input"]');
        if (messageBox) {
          Logger.info('[WA DEBUG] Direct URL method successful - message box found');
          return true;
        }
        */
      //}
      /*
      Logger.warn('[WA DEBUG] Direct URL method timeout - message box not found');
      return false;
      */
     return true;
    } catch (error) {
      Logger.error('[WA DEBUG] Direct URL method failed', error as Error);
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
  if (message.type === 'WHATSAPP_AUTOMATION') {
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
        const sent = await whatsappAutomation.sendMessage(message.message);
        sendResponse({ success: true, data: sent });
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
