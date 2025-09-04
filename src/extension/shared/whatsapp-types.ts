/**
 * TypeScript types for WhatsApp automation in EventConnect
 */

export interface Guest {
  rowNumber: number;
  fullName: string;
  whatsappNumber: string;
  invitationMessage: string;
  language: string;
  rsvpStatus: string;
}

export interface SendProgress {
  totalGuests: number;
  currentGuest: number;
  successCount: number;
  errorCount: number;
  currentGuestName: string;
  isComplete: boolean;
}

export interface SendResult {
  success: boolean;
  guestName: string;
  phoneNumber: string;
  error?: string;
  timestamp: number;
}

export interface WhatsAppMessage {
  type: 'START_BULK_SEND' | 'SEND_TO_GUEST' | 'UPDATE_PROGRESS' | 'SENDING_COMPLETE' | 'CHECK_WHATSAPP_READY' | 'OPEN_WHATSAPP_TAB';
  payload?: any;
}

export interface WhatsAppAutomation {
  searchContact(phoneNumber: string): Promise<boolean>;
  openChat(phoneNumber: string): Promise<boolean>;
  sendMessage(message: string): Promise<boolean>;
  detectSendSuccess(): Promise<boolean>;
  getCurrentChat(): Promise<string | null>;
  isWhatsAppReady(): Promise<boolean>;
}

export interface WhatsAppCoordinator {
  startBulkSending(guests: Guest[]): Promise<void>;
  sendToSingleGuest(guest: Guest): Promise<SendResult>;
  updateSheetStatus(guestId: string, status: string): Promise<void>;
  handleSendingProgress(progress: SendProgress): void;
}

export interface WhatsAppSelectors {
  searchBox: string;
  searchInput: string;
  chatItem: string;
  messageBox: string;
  sendButton: string;
  messageStatus: string;
  contactList: string;
  chatHeader: string;
}

export interface WhatsAppError {
  type: 'CONTACT_NOT_FOUND' | 'SEND_FAILURE' | 'NOT_READY' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  message: string;
  phoneNumber?: string;
  guestName?: string;
}
