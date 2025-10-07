import { Logger } from '../shared/logger';

/**
 * Service for sending WhatsApp messages via Cloudflare Worker relay
 */
export class WhatsAppCloudService {
  private readonly workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl;
  }

  /**
   * Send text message to WhatsApp number
   * @param to Phone number in E.164 format (digits only, no +)
   * @param body Message text
   */
  async sendText(to: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
      Logger.info(`[WABA] Sending message to ${to}`);
      
      const response = await fetch(`${this.workerUrl}/wa/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to, body })
      });

      const result = await response.json();
      
      if (result.ok) {
        Logger.info(`[WABA] Message sent successfully. ID: ${result.id}`);
        return { ok: true, id: result.id };
      } else {
        Logger.error(`[WABA] Failed to send message: ${result.error}`);
        return { ok: false, error: result.error };
      }
    } catch (error) {
      Logger.error('[WABA] Error sending message:', error as Error);
      return { ok: false, error: (error as Error).message };
    }
  }

  /**
   * Normalize phone number to E.164 format (digits only, no +)
   * WhatsApp Cloud API requires numbers without + prefix
   */
  normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with +, already removed above
    // If starts with 0 (e.g., Indonesian 08xxx), assume country code 62
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    Logger.info(`[WABA] Normalized ${phone} → ${cleaned}`);
    return cleaned;
  }

  /**
   * Poll for incoming messages/events from worker
   */
  async pollEvents(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${this.workerUrl}/wa/events?limit=${limit}`);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      Logger.error('[WABA] Error polling events:', error as Error);
      return [];
    }
  }

  /**
   * Acknowledge processed events (delete from worker KV)
   */
  async acknowledgeEvents(keys: string[]): Promise<void> {
    try {
      await fetch(`${this.workerUrl}/wa/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      });
      Logger.info(`[WABA] Acknowledged ${keys.length} events`);
    } catch (error) {
      Logger.error('[WABA] Error acknowledging events:', error as Error);
    }
  }
}