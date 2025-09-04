/**
 * Google Sheets API Extensions for WhatsApp Automation
 * Extends existing sheets functionality with WhatsApp-specific operations
 */

import { Guest } from './whatsapp-types';
import { Logger } from './logger';

export interface WhatsAppSheetsConfig {
  guestSheetName: string;
  templateSheetName: string;
  requiredColumns: {
    fullName: string;
    whatsappNumber: string;
    language: string;
    invitationMessage: string;
    rsvpStatus: string;
  };
}

export const DEFAULT_CONFIG: WhatsAppSheetsConfig = {
  guestSheetName: 'Whatsapp Invitation Sender',
  templateSheetName: '[JAKARTA] Invitation Message Templates',
  requiredColumns: {
    fullName: 'Full Name (as written in invitation message)',
    whatsappNumber: 'WhatsApp Number',
    language: 'Language',
    invitationMessage: 'Invitation Message',
    rsvpStatus: 'RSVP Status'
  }
};

export class WhatsAppSheetsAPI {
  constructor(
    private getAuthToken: () => Promise<string | null>,
    private config: WhatsAppSheetsConfig = DEFAULT_CONFIG
  ) {}

  /**
   * Get guests with "Needs Invite (WA)" status
   */
  async getPendingWhatsAppGuests(sheetId: string): Promise<Guest[]> {
    try {
      Logger.info(`Fetching pending WhatsApp guests from sheet: ${sheetId}`);

      // Read the guest sheet data
      const guestData = await this.readRange(sheetId, `${this.config.guestSheetName}!A:Z`);
      
      if (!guestData || guestData.length < 2) {
        throw new Error('Guest sheet is empty or has no data');
      }

      // Parse headers
      const headers = guestData[0];
      const columnMap = this.mapColumns(headers);

      // Filter and parse guests
      const pendingGuests: Guest[] = [];

      for (let i = 1; i < guestData.length; i++) {
        const row = guestData[i];
        const rsvpStatus = row[columnMap.rsvpStatus] || '';

        // Only include guests with "Needs Invite (WA)" status
        if (rsvpStatus.trim() === 'Needs Invite (WA)') {
          const guest: Guest = {
            rowNumber: i + 1, // 1-based row number (including header)
            fullName: row[columnMap.fullName] || '',
            whatsappNumber: row[columnMap.whatsappNumber] || '',
            invitationMessage: row[columnMap.invitationMessage] || '',
            language: row[columnMap.language] || 'English',
            rsvpStatus: rsvpStatus
          };

          // Validate required fields
          if (guest.fullName && guest.whatsappNumber && guest.invitationMessage) {
            pendingGuests.push(guest);
          } else {
            Logger.warn(`Skipping incomplete guest data at row ${i + 1}`);
          }
        }
      }

      Logger.info(`Found ${pendingGuests.length} pending WhatsApp guests`);
      return pendingGuests;

    } catch (error) {
      Logger.error('Failed to get pending WhatsApp guests', error as Error);
      throw new Error(`Failed to fetch guests: ${(error as Error).message}`);
    }
  }

  /**
   * Update RSVP status after successful send
   */
  async updateGuestRSVPStatus(sheetId: string, rowNumber: number, newStatus: string): Promise<void> {
    try {
      Logger.info(`Updating RSVP status for row ${rowNumber} to: ${newStatus}`);

      // Get column headers to find RSVP Status column
      const headers = await this.readRange(sheetId, `${this.config.guestSheetName}!1:1`);
      if (!headers || headers.length === 0) {
        throw new Error('Could not read sheet headers');
      }

      const columnMap = this.mapColumns(headers[0]);
      const statusColumn = this.numberToColumn(columnMap.rsvpStatus + 1); // Convert to A1 notation

      // Update the specific cell
      const range = `${this.config.guestSheetName}!${statusColumn}${rowNumber}`;
      await this.updateRange(sheetId, range, [[newStatus]]);

      Logger.info(`Successfully updated RSVP status for row ${rowNumber}`);

    } catch (error) {
      Logger.error(`Failed to update RSVP status for row ${rowNumber}`, error as Error);
      throw error;
    }
  }

  /**
   * Batch update multiple guests' statuses
   */
  async batchUpdateRSVPStatuses(sheetId: string, updates: Array<{rowNumber: number, status: string}>): Promise<void> {
    try {
      Logger.info(`Batch updating ${updates.length} RSVP statuses`);

      // Get column headers
      const headers = await this.readRange(sheetId, `${this.config.guestSheetName}!1:1`);
      if (!headers || headers.length === 0) {
        throw new Error('Could not read sheet headers');
      }

      const columnMap = this.mapColumns(headers[0]);
      const statusColumn = this.numberToColumn(columnMap.rsvpStatus + 1);

      // Prepare batch update data
      const batchData = updates.map(update => ({
        range: `${this.config.guestSheetName}!${statusColumn}${update.rowNumber}`,
        values: [[update.status]]
      }));

      // Execute batch update
      await this.batchUpdate(sheetId, batchData);

      Logger.info(`Successfully batch updated ${updates.length} RSVP statuses`);

    } catch (error) {
      Logger.error('Failed to batch update RSVP statuses', error as Error);
      throw error;
    }
  }

  /**
   * Get specific columns for WhatsApp sending
   */
  async getWhatsAppGuestData(sheetId: string): Promise<Guest[]> {
    try {
      Logger.info(`Getting WhatsApp guest data from sheet: ${sheetId}`);

      // Read the entire guest sheet
      const guestData = await this.readRange(sheetId, `${this.config.guestSheetName}!A:Z`);
      
      if (!guestData || guestData.length < 2) {
        return [];
      }

      // Parse headers and data
      const headers = guestData[0];
      const columnMap = this.mapColumns(headers);

      const guests: Guest[] = [];

      for (let i = 1; i < guestData.length; i++) {
        const row = guestData[i];
        
        const guest: Guest = {
          rowNumber: i + 1,
          fullName: row[columnMap.fullName] || '',
          whatsappNumber: row[columnMap.whatsappNumber] || '',
          invitationMessage: row[columnMap.invitationMessage] || '',
          language: row[columnMap.language] || 'English',
          rsvpStatus: row[columnMap.rsvpStatus] || ''
        };

        if (guest.fullName && guest.whatsappNumber) {
          guests.push(guest);
        }
      }

      Logger.info(`Retrieved ${guests.length} WhatsApp guest records`);
      return guests;

    } catch (error) {
      Logger.error('Failed to get WhatsApp guest data', error as Error);
      throw error;
    }
  }

  /**
   * Validate WhatsApp sheet structure
   */
  async validateWhatsAppSheetStructure(sheetId: string): Promise<{isValid: boolean, error?: string}> {
    try {
      // Check if guest sheet exists
      const sheetInfo = await this.getSheetInfo(sheetId);
      const hasGuestSheet = sheetInfo.sheets.some((sheet: any) =>
        sheet.properties.title === this.config.guestSheetName
      );

      if (!hasGuestSheet) {
        return {
          isValid: false,
          error: `Required sheet "${this.config.guestSheetName}" not found`
        };
      }

      // Check required columns
      const headers = await this.readRange(sheetId, `${this.config.guestSheetName}!1:1`);
      if (!headers || headers.length === 0) {
        return {
          isValid: false,
          error: 'Could not read sheet headers'
        };
      }

      const headerRow = headers[0];
      const missingColumns = [];

      for (const [key, columnName] of Object.entries(this.config.requiredColumns)) {
        if (!headerRow.includes(columnName)) {
          missingColumns.push(columnName);
        }
      }

      if (missingColumns.length > 0) {
        return {
          isValid: false,
          error: `Missing required columns: ${missingColumns.join(', ')}`
        };
      }

      return { isValid: true };

    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${(error as Error).message}`
      };
    }
  }

  // Private utility methods

  private mapColumns(headers: string[]): Record<string, number> {
    const columnMap: Record<string, number> = {};
    
    for (const [key, columnName] of Object.entries(this.config.requiredColumns)) {
      const index = headers.findIndex(header => header.trim() === columnName);
      if (index !== -1) {
        columnMap[key] = index;
      }
    }

    return columnMap;
  }

  private numberToColumn(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  private async readRange(sheetId: string, range: string): Promise<any[][]> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  private async updateRange(sheetId: string, range: string, values: any[][]): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
    }
  }

  private async batchUpdate(sheetId: string, updates: Array<{range: string, values: any[][]}>): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
    
    const requestBody = {
      valueInputOption: 'RAW',
      data: updates
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
    }
  }

  private async getSheetInfo(sheetId: string): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
