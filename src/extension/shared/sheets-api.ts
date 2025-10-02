/**
 * Google Sheets API Extensions for WhatsApp Automation
 * Extends existing sheets functionality with WhatsApp-specific operations
 */

import { Guest } from './whatsapp-types';
import { Logger } from './logger';
import { Ceremony } from '../popup/context/EventContext';
import { GoogleDriveService } from '../background/google-drive-service';

export interface WhatsAppSheetsConfig {
  guestSheetName: string;
  templateSheetName: string;
  requiredColumns: {
    fullName: string;
    whatsappNumber: string;
    language: string;
    invitationMessage: string;
    whatsappInviteLink: string;
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
    whatsappInviteLink: 'WhatsApp Invite Link',
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

      Logger.info("Headers: " + JSON.stringify(headers));
      Logger.info("Column map: " + JSON.stringify(columnMap));
      
      // Add validation: Check if ceremony columns exist
      Logger.info(`[DEBUG] Ceremony column indices - Pengajian: ${columnMap.pengajian}, Siraman: ${columnMap.siraman}, Akad Nikah: ${columnMap.akadnikah}, Syukuran: ${columnMap.syukuran}`);

      // Filter and parse guests
      const pendingGuests: Guest[] = [];

      for (let i = 1; i < guestData.length; i++) {
        const row = guestData[i];
        const rsvpStatus = row[columnMap.rsvpStatus] || '';

        // Only include guests with "Needs Invite (WA)" status
        if (rsvpStatus.trim() === 'Needs Invite (WA)') {
          // Helper function to parse checkbox values
          const parseCheckbox = (value: string | undefined): boolean => {
            if (!value) return false;
            const normalized = value.toString().toUpperCase().trim();
            return normalized === 'TRUE' || normalized === 'YES' || normalized === 'X' || normalized === '1';
          };

          // Parse ceremony values from sheet
          const pengajian = parseCheckbox(row[columnMap.pengajian]);
          const siraman = parseCheckbox(row[columnMap.siraman]);
          const akadNikah = parseCheckbox(row[columnMap.akadnikah]); // Note: camelCase conversion
          const syukuran = parseCheckbox(row[columnMap.syukuran]);

          // Add detailed logging for debugging
          Logger.info(`[DEBUG] Row ${i + 1} (${row[columnMap.fullName]}): Pengajian="${row[columnMap.pengajian]}"→${pengajian}, Siraman="${row[columnMap.siraman]}"→${siraman}, Akad Nikah="${row[columnMap.akadnikah]}"→${akadNikah}, Syukuran="${row[columnMap.syukuran]}"→${syukuran}`);

          const guest: Guest = {
            rowNumber: i + 1, // 1-based row number (including header)
            fullName: row[columnMap.fullName] || '',
            whatsappNumber: row[columnMap.whatsappNumber] || '',
            invitationMessage: row[columnMap.invitationMessage] || '',
            language: row[columnMap.language] || 'English',
            whatsappInviteLink: row[columnMap.whatsappInviteLink] || '',
            rsvpStatus: rsvpStatus,
            
            // Add ceremony attendance flags with proper boolean parsing
            pengajian,
            siraman,
            akadNikah,
            syukuran
          };

          Logger.info(`[DEBUG] Guest added: ${guest.fullName} - Ceremonies: P=${guest.pengajian}, S=${guest.siraman}, A=${guest.akadNikah}, Sy=${guest.syukuran}`);

          // Validate required fields
          if (guest.fullName && guest.whatsappInviteLink) {
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
          whatsappInviteLink: row[columnMap.whatsappInviteLink] || '',
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
    
    // Map required columns from config
    for (const [key, columnName] of Object.entries(this.config.requiredColumns)) {
      const index = headers.findIndex(header => header.trim() === columnName);
      if (index !== -1) {
        columnMap[key] = index;
      }
    }

    // Map ceremony columns dynamically
    const ceremonyColumns = ['Pengajian', 'Siraman', 'Akad Nikah', 'Syukuran'];
    ceremonyColumns.forEach(ceremonyName => {
      const index = headers.findIndex(header => header.trim() === ceremonyName);
      if (index !== -1) {
        // Convert ceremony name to property name (e.g., "Akad Nikah" -> "akadNikah")
        const propertyName = ceremonyName.toLowerCase()
          .replace(/\s+/g, '') // Remove spaces
          .replace(/^(.)/, (match) => match.toLowerCase()) // Ensure first letter is lowercase
          .replace(/\s(.)/g, (match, char) => char.toUpperCase()); // camelCase
        
        columnMap[propertyName] = index;
      }
    });

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

  /**
   * Get ceremony information from [JAKARTA] Invitation Message Templates tab
   */
  async getCeremonies(sheetId: string): Promise<Array<Ceremony>> {
    const token = await this.getAuthToken();
    
    Logger.info('[DEBUG] Getting ceremony information from Templates tab');
    
    // Read the entire Templates tab to find headers and links
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent('[JAKARTA] Invitation Message Templates!A1:Z10')}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to read ceremony info: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    Logger.info(`[DEBUG] Templates tab has ${rows.length} rows`);
    
    if (rows.length === 0) {
      Logger.warn('[DEBUG] Templates tab is empty');
      return [];
    }
    
    // Row 1 contains headers
    const headers = rows[0] || [];
    Logger.info(`[DEBUG] Headers from row 1: ${JSON.stringify(headers)}`);
    
    // Find the row that contains "Invitation Link" in column A
    let linkRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] && rows[i][0].toString().toLowerCase().includes('invitation link')) {
        linkRowIndex = i;
        Logger.info(`[DEBUG] Found "Invitation Link" label at row ${i + 1}`);
        break;
      }
    }
    
    if (linkRowIndex === -1) {
      Logger.error('[DEBUG] Could not find "Invitation Link" row in Templates tab');
      return [];
    }
    
    // The links should be in the same row as "Invitation Link
    const linkRow = rows[linkRowIndex] || [];
    Logger.info(`[DEBUG] Video links from row ${linkRowIndex}: ${JSON.stringify(linkRow)}`);
    
    // Build ceremony objects by matching headers with links
    const ceremonies: Array<Ceremony> = [];
    
    // Start from column 1 (index 1) since column 0 is "Main Invitation Message"
    for (let i = 1; i < headers.length; i++) {
      const ceremonyName = headers[i];
      const driveLink = linkRow[i];
      
      // Skip empty headers or the main message column
      if (!ceremonyName || ceremonyName.toString().toLowerCase().includes('main invitation')) {
        continue;
      }
      
      Logger.info(`[DEBUG] Processing column ${i} ceremony: "${ceremonyName}" with link: "${driveLink}"`);
      
      if (driveLink && driveLink.toString().includes('drive.google.com')) {
        const driveFileId = GoogleDriveService.extractFileId(driveLink.toString());
        
        if (driveFileId) {
          // Normalize ceremony name to match Guest object property names
          const ceremonyId = this.normalizeCeremonyName(ceremonyName.toString());
          
          ceremonies.push({
            id: ceremonyId,
            name: ceremonyName.toString(),
            driveFileId
          });
          
          Logger.info(`[DEBUG] Added ceremony: ${ceremonyName} (${ceremonyId}) - Drive ID: ${driveFileId}`);
        } else {
          Logger.warn(`[DEBUG] Could not extract Drive file ID from: ${driveLink}`);
        }
      } else {
        Logger.warn(`[DEBUG] Ceremony "${ceremonyName}" has no valid Drive link`);
      }
    }
    
    Logger.info(`[DEBUG] Found ${ceremonies.length} ceremonies with Drive files`);
    return ceremonies;
  }

  /**
   * Normalize ceremony name to match Guest object property names
   * This ensures consistency between sheet columns and code
   */
  private normalizeCeremonyName(name: string): string {
    // Convert to lowercase and remove spaces/special chars for consistent IDs
    const normalized = name.toLowerCase()
      .replace(/\s+/g, '')  // Remove all spaces
      .replace(/[^a-z0-9]/g, '');  // Remove special characters
    
    // Map specific ceremony names to camelCase property names used in Guest interface
    const ceremonyMap: Record<string, string> = {
      'pengajian': 'pengajian',
      'siraman': 'siraman',
      'akadnikah': 'akadNikah',  // Map to camelCase
      'syukuran': 'syukuran',
      'reception': 'syukuran',  // Alternative name
      'receptionsyukuran': 'syukuran'  // Alternative name
    };
    
    const result = ceremonyMap[normalized] || normalized;
    Logger.info(`[DEBUG] Normalized ceremony name "${name}" → "${result}"`);
    return result;
  }

  /**
   * Get guests with ceremony attendance flags
   */
  async getPendingWhatsAppGuestsWithCeremonies(sheetId: string): Promise<Guest[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      Logger.info(`[Sheets] Fetching guests with ceremony information from sheet: ${sheetId}`);
      
      // Read guest data
      const guestData = await this.readRange(sheetId, `${this.config.guestSheetName}!A:Z`);
      if (!guestData || guestData.length === 0) {
        throw new Error('No guest data found');
      }

      const headers = guestData[0];
      const columnMap = this.mapColumns(headers);
      
      // Also get ceremony headers from Event Information tab
      const ceremonies = await this.getCeremonies(sheetId);
      const ceremonyIds = ceremonies.map(c => c.id);
      
      Logger.info(`[Sheets] Processing guests with ceremonies: ${ceremonyIds.join(', ')}`);

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
            whatsappInviteLink: row[columnMap.whatsappInviteLink] || '',
            rsvpStatus: rsvpStatus
          };

          // Add ceremony attendance flags based on checkboxes in guest row
          // Look for ceremony columns in the guest data
          for (const ceremony of ceremonies) {
            const ceremonyColumnIndex = headers.findIndex((header: string) => 
              header.toLowerCase().includes(ceremony.name.toLowerCase())
            );
            
            if (ceremonyColumnIndex !== -1) {
              const ceremonyValue = row[ceremonyColumnIndex];
              // Check for various checkbox indicators
              const isAttending = ceremonyValue === 'TRUE' || 
                                ceremonyValue === 'Yes' || 
                                ceremonyValue === '1' || 
                                ceremonyValue === true;
              
              guest[ceremony.id] = isAttending;
              
              if (isAttending) {
                Logger.info(`[Sheets] Guest ${guest.fullName} attending ${ceremony.name}`);
              }
            }
          }

          // Validate required fields
          if (guest.fullName && guest.whatsappInviteLink) {
            pendingGuests.push(guest);
          } else {
            Logger.warn(`[Sheets] Skipping incomplete guest data at row ${i + 1} - missing required fields`);
          }
        }
      }

      Logger.info(`[Sheets] Found ${pendingGuests.length} pending WhatsApp guests with ceremony data`);
      return pendingGuests;

    } catch (error) {
      Logger.error('[Sheets] Failed to get pending WhatsApp guests with ceremonies', error as Error);
      throw new Error(`Failed to fetch guests: ${(error as Error).message}`);
    }
  }
}
