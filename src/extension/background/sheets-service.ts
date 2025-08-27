/**
 * Google Sheets Service for EventConnect Extension
 * Direct integration with Google Sheets API v4
 */

import { Logger } from '../shared/logger';

interface SheetColumn {
  name: string;
  description: string;
}

interface SheetTab {
  headerRow: number;
  columns: SheetColumn[];
}

interface SheetStructure {
  tabs: Record<string, SheetTab>;
  sheetTitle?: string;
  totalTabs?: number;
}

interface EventData {
  eventName: string;
  eventDate: string;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    completed: number;
    total: number;
    upcoming: TaskItem[];
  };
  vendors: VendorContact[];
  timeline: TimelineItem[];
}

interface TaskItem {
  name: string;
  dueDate: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
}

interface VendorContact {
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  status: string;
}

interface TimelineItem {
  task: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
}

export class GoogleSheetsService {
  private static readonly API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  constructor(private getAuthToken: () => Promise<string | null>) {}

  /**
   * Read complete event data from Google Sheet
   */
  async readEventSheet(sheetId: string): Promise<EventData> {
    try {
      Logger.info(`Reading event data from sheet: ${sheetId}`);

      // Validate sheet structure first
      const validation = await this.validateSheetStructure(sheetId);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Sheet does not have the expected EventConnect structure');
      }

      // Get stored sheet structure to read data dynamically
      const structure = await this.getSheetStructure(sheetId);
      if (!structure) {
        throw new Error('Sheet structure not found. Please reconnect the sheet.');
      }

      // Read data from available tabs based on structure
      const sheetData: Record<string, any[][]> = {};
      
      for (const [tabName, tabInfo] of Object.entries(structure.tabs)) {
        try {
          const range = `${tabName}!A:Z`; // Read all columns
          sheetData[tabName] = await this.readRange(sheetId, range);
        } catch (error) {
          console.warn(`Could not read tab ${tabName}:`, error);
          sheetData[tabName] = [];
        }
      }

      const eventData = this.parseFlexibleEventData(sheetData, structure);
      
      Logger.info('Successfully read event data from sheet');
      return eventData;

    } catch (error) {
      Logger.error('Failed to read event sheet', error as Error);
      throw new Error(`Failed to read event data: ${(error as Error).message}`);
    }
  }

  /**
   * Update event data in Google Sheet
   */
  async updateEventData(sheetId: string, updates: Partial<EventData>): Promise<void> {
    try {
      Logger.info(`Updating event data in sheet: ${sheetId}`);

      const updatePromises: Promise<void>[] = [];

      // Update event overview if provided
      if (updates.eventName || updates.eventDate) {
        const overviewUpdates = this.prepareOverviewUpdates(updates);
        updatePromises.push(
          this.updateRange(sheetId, 'Event Overview!B1:B7', overviewUpdates)
        );
      }

      // Update budget if provided
      if (updates.budget) {
        const budgetUpdates = this.prepareBudgetUpdates(updates.budget);
        updatePromises.push(
          this.updateRange(sheetId, 'Budget!A2:H100', budgetUpdates)
        );
      }

      // Update vendors if provided
      if (updates.vendors) {
        const vendorUpdates = this.prepareVendorUpdates(updates.vendors);
        updatePromises.push(
          this.updateRange(sheetId, 'Vendors!A2:H100', vendorUpdates)
        );
      }

      // Update timeline if provided
      if (updates.timeline) {
        const timelineUpdates = this.prepareTimelineUpdates(updates.timeline);
        updatePromises.push(
          this.updateRange(sheetId, 'Timeline!A2:G100', timelineUpdates)
        );
      }

      await Promise.all(updatePromises);
      
      Logger.info('Successfully updated event data in sheet');

    } catch (error) {
      Logger.error('Failed to update event sheet', error as Error);
      throw new Error(`Failed to update event data: ${(error as Error).message}`);
    }
  }

  /**
   * Append entry to event log
   */
  async appendToEventLog(sheetId: string, entry: string): Promise<void> {
    try {
      Logger.info(`Appending log entry to sheet: ${sheetId}`);

      const timestamp = new Date().toISOString();
      const logEntry = [[timestamp, entry, 'Extension']];

      await this.appendToSheet(sheetId, 'Event Log!A:C', logEntry);
      
      Logger.info('Successfully appended to event log');

    } catch (error) {
      Logger.error('Failed to append to event log', error as Error);
      throw new Error(`Failed to add log entry: ${(error as Error).message}`);
    }
  }

  /**
   * Validate sheet structure by reading README tab
   */
  async validateSheetStructure(sheetId: string): Promise<{ isValid: boolean; structure?: SheetStructure; error?: string }> {
    try {
      console.log('Reading sheet structure from README tab:', sheetId);
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // First, check if sheet is accessible
      const sheetInfoResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties.title`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!sheetInfoResponse.ok) {
        if (sheetInfoResponse.status === 403) {
          return { 
            isValid: false, 
            error: 'Permission denied. Please ensure the sheet is shared with your Google account.' 
          };
        } else if (sheetInfoResponse.status === 404) {
          return { 
            isValid: false, 
            error: 'Sheet not found. Please check the Sheet ID.' 
          };
        } else {
          return { 
            isValid: false, 
            error: `Sheet access failed: ${sheetInfoResponse.statusText}` 
          };
        }
      }

      const sheetInfo = await sheetInfoResponse.json();
      console.log('Sheet accessible:', sheetInfo.properties.title);

      // Check if README tab exists
      const readmeTab = sheetInfo.sheets?.find((sheet: any) => 
        sheet.properties.title.toLowerCase() === 'readme'
      );

      if (!readmeTab) {
        return {
          isValid: false,
          error: 'README tab not found. Please create a README tab in your Google Sheets with the structure definition table (Tab, Header Row, Column, Column Description).'
        };
      }

      console.log('README tab found, reading structure...');

      // Read README tab content
      const readmeResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/README!A:Z`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!readmeResponse.ok) {
        return {
          isValid: false,
          error: 'Failed to read README tab content.'
        };
      }

      const readmeData = await readmeResponse.json();
      
      if (!readmeData.values || readmeData.values.length === 0) {
        return {
          isValid: false,
          error: 'README tab is empty. Please add the structure definition table.'
        };
      }

      // Parse README structure
      const structure = this.parseReadmeStructure(readmeData.values);
      
      if (!structure || Object.keys(structure.tabs).length === 0) {
        return {
          isValid: false,
          error: 'Could not parse sheet structure from README tab. Please ensure the table has columns: Tab, Header Row, Column, Column Description.'
        };
      }

      console.log('Sheet structure parsed successfully:', Object.keys(structure.tabs).length, 'tabs found');

      return {
        isValid: true,
        structure: {
          ...structure,
          sheetTitle: sheetInfo.properties.title,
          totalTabs: Object.keys(structure.tabs).length
        }
      };

    } catch (error) {
      console.error('Sheet structure validation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific error types
      if (errorMessage?.includes('fetch')) {
        return { 
          isValid: false, 
          error: 'Network error. Please check your internet connection and try again.' 
        };
      }
      
      if (errorMessage?.includes('quota') || errorMessage?.includes('rate limit')) {
        return { 
          isValid: false, 
          error: 'Google Sheets API quota exceeded. Please try again in a few minutes.' 
        };
      }
      
      if (errorMessage?.includes('authentication') || errorMessage?.includes('token')) {
        return { 
          isValid: false, 
          error: 'Authentication expired. Please sign in again.' 
        };
      }
      
      if (errorMessage?.includes('parse')) {
        return { 
          isValid: false, 
          error: 'README tab structure is invalid. Please ensure it has columns: Tab, Header Row, Column, Column Description.' 
        };
      }
      
      return {
        isValid: false,
        error: `Failed to read sheet structure: ${errorMessage}`
      };
    }
  }

  /**
   * Get sheet name
   */
  async getSheetName(sheetId: string): Promise<{ name: string } | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) return null;
  
      const response = await fetch(
        `${GoogleSheetsService.API_BASE_URL}/${sheetId}?fields=properties.title`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        return { name: data.properties.title };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get sheet info:', error);
      return null;
    }
  }

  /**
   * Read data from specific range in sheet
   */
  private async readRange(sheetId: string, range: string): Promise<any[][]> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${GoogleSheetsService.API_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}`;
    
    let lastError: Error;
    for (let attempt = 1; attempt <= GoogleSheetsService.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 429) {
          // Rate limited, wait and retry
          await this.sleep(GoogleSheetsService.RETRY_DELAY * attempt);
          continue;
        }

        if (!response.ok) {
          throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.values || [];

      } catch (error) {
        lastError = error as Error;
        if (attempt < GoogleSheetsService.MAX_RETRIES) {
          await this.sleep(GoogleSheetsService.RETRY_DELAY * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Update data in specific range
   */
  private async updateRange(sheetId: string, range: string, values: any[][]): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${GoogleSheetsService.API_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values,
        majorDimension: 'ROWS'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update sheet: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Append data to sheet
   */
  private async appendToSheet(sheetId: string, range: string, values: any[][]): Promise<void> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${GoogleSheetsService.API_BASE_URL}/${sheetId}/values/${encodeURIComponent(range)}:append`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values,
        majorDimension: 'ROWS',
        valueInputOption: 'USER_ENTERED'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to append to sheet: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get sheet metadata
   */
  private async getSheetMetadata(sheetId: string): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${GoogleSheetsService.API_BASE_URL}/${sheetId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get sheet metadata: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse sheet data flexibly based on README structure
   */
  private parseFlexibleEventData(
    sheetData: Record<string, any[][]>,
    structure: SheetStructure
  ): EventData {
    // Default values
    let eventName = structure.sheetTitle || 'Untitled Event';
    let eventDate = '';
    let budgetTotal = 0;
    let budgetSpent = 0;
    let tasks: TaskItem[] = [];
    let vendors: VendorContact[] = [];
    let timelineItems: TimelineItem[] = [];

    // Try to extract data from available tabs
    for (const [tabName, tabInfo] of Object.entries(structure.tabs)) {
      const tabData = sheetData[tabName];
      if (!tabData || tabData.length === 0) continue;

      const dataRows = tabData.slice(tabInfo.headerRow); // Skip to data rows

      // Look for common patterns in tab names and columns
      const lowerTabName = tabName.toLowerCase();
      
      // Extract event overview data
      if (lowerTabName.includes('overview') || lowerTabName.includes('info')) {
        for (const row of tabData) {
          if (row[0] && row[1]) {
            const key = String(row[0]).toLowerCase();
            if (key.includes('event') && key.includes('name')) {
              eventName = String(row[1]) || eventName;
            } else if (key.includes('date')) {
              eventDate = String(row[1]) || eventDate;
            } else if (key.includes('budget') && key.includes('total')) {
              budgetTotal = this.parseNumber(row[1]);
            }
          }
        }
      }

      // Extract budget data
      if (lowerTabName.includes('budget') || lowerTabName.includes('expense')) {
        for (const row of dataRows) {
          if (row[0]) {
            // Look for amount columns
            for (let i = 1; i < row.length; i++) {
              const amount = this.parseNumber(row[i]);
              if (amount > 0) {
                budgetSpent += amount;
                break; // Only count first amount per row
              }
            }
          }
        }
      }

      // Extract tasks data
      if (lowerTabName.includes('task') || lowerTabName.includes('todo') || lowerTabName.includes('timeline')) {
        for (const row of dataRows) {
          if (row[0]) {
            tasks.push({
              name: String(row[0]) || '',
              dueDate: String(row[1] || ''),
              assignedTo: String(row[2] || ''),
              priority: this.parsePriority(String(row[3] || ''))
            });
          }
        }
      }

      // Extract vendor data
      if (lowerTabName.includes('vendor') || lowerTabName.includes('supplier') || lowerTabName.includes('contact')) {
        for (const row of dataRows) {
          if (row[0]) {
            vendors.push({
              name: String(row[0]) || '',
              category: String(row[1] || ''),
              contact: String(row[2] || ''),
              email: String(row[3] || ''),
              phone: String(row[4] || ''),
              status: String(row[5] || 'pending')
            });
          }
        }
      }
    }

    // Calculate completed tasks
    const completedTasks = tasks.filter(task => 
      task.name.toLowerCase().includes('complete') ||
      task.assignedTo.toLowerCase().includes('complete')
    ).length;

    const upcomingTasks = tasks
      .filter(task => !task.name.toLowerCase().includes('complete'))
      .slice(0, 5);

    return {
      eventName,
      eventDate,
      budget: {
        total: budgetTotal,
        spent: budgetSpent,
        remaining: budgetTotal - budgetSpent
      },
      tasks: {
        completed: completedTasks,
        total: tasks.length,
        upcoming: upcomingTasks
      },
      vendors,
      timeline: timelineItems
    };
  }

  /**
   * Parse priority from string
   */
  private parsePriority(value: string): 'high' | 'medium' | 'low' {
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent')) return 'high';
    if (lower.includes('low')) return 'low';
    return 'medium';
  }

  /**
   * Prepare overview updates for sheet
   */
  private prepareOverviewUpdates(updates: Partial<EventData>): any[][] {
    const values: any[][] = [];
    
    if (updates.eventName) values.push([updates.eventName]);
    if (updates.eventDate) values.push([updates.eventDate]);
    
    return values;
  }

  /**
   * Prepare budget updates for sheet
   */
  private prepareBudgetUpdates(budget: EventData['budget']): any[][] {
    // This would contain the logic to format budget data for sheet update
    // Implementation depends on specific sheet structure
    return [];
  }

  /**
   * Prepare vendor updates for sheet
   */
  private prepareVendorUpdates(vendors: VendorContact[]): any[][] {
    return vendors.map(vendor => [
      vendor.name,
      vendor.category,
      vendor.contact,
      vendor.email,
      vendor.phone,
      vendor.status
    ]);
  }

  /**
   * Prepare timeline updates for sheet
   */
  private prepareTimelineUpdates(timeline: TimelineItem[]): any[][] {
    return timeline.map(item => [
      item.task,
      item.dueDate,
      item.assignedTo,
      item.status
    ]);
  }

  /**
   * Parse string to number safely
   */
  private parseNumber(value: any): number {
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse README tab content to extract sheet structure
   */
  private parseReadmeStructure(readmeValues: string[][]): SheetStructure | null {
    try {
      // Find header row (should contain: Tab, Header Row, Column, Column Description)
      let headerRowIndex = -1;
      const expectedHeaders = ['tab', 'header row', 'column', 'column description'];
      
      for (let i = 0; i < readmeValues.length; i++) {
        const row = readmeValues[i];
        if (row && row.length >= 4) {
          const normalizedRow = row.slice(0, 4).map(cell => 
            (cell || '').toLowerCase().trim()
          );
          
          if (expectedHeaders.every(header => 
            normalizedRow.some(cell => cell.includes(header.split(' ')[0]))
          )) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        console.error('Could not find header row with expected columns');
        return null;
      }

      console.log('Found header row at index:', headerRowIndex);

      // Parse data rows
      const structure: SheetStructure = { tabs: {} };
      
      for (let i = headerRowIndex + 1; i < readmeValues.length; i++) {
        const row = readmeValues[i];
        if (!row || row.length < 4) continue;

        const [tabName, headerRow, columnName, columnDescription] = row;
        
        if (!tabName || !columnName) continue;
        if (tabName.toLowerCase().includes('ignore')) continue;

        const cleanTabName = tabName.trim();
        const cleanColumnName = columnName.trim();
        const cleanDescription = (columnDescription || '').trim();
        const headerRowNum = parseInt(headerRow) || 1;

        // Initialize tab if it doesn't exist
        if (!structure.tabs[cleanTabName]) {
          structure.tabs[cleanTabName] = {
            headerRow: headerRowNum,
            columns: []
          };
        }

        // Add column to tab
        if (cleanColumnName && !cleanColumnName.toLowerCase().includes('ignore')) {
          structure.tabs[cleanTabName].columns.push({
            name: cleanColumnName,
            description: cleanDescription
          });
        }
      }

      return structure;

    } catch (error) {
      console.error('Error parsing README structure:', error);
      return null;
    }
  }

  /**
   * Get stored sheet structure for a specific sheet
   */
  async getSheetStructure(sheetId: string): Promise<SheetStructure | null> {
    try {
      const stored = await chrome.storage.local.get([
        `sheetStructure_${sheetId}`,
        `sheetStructure_timestamp_${sheetId}`
      ]);

      if (!stored[`sheetStructure_${sheetId}`]) {
        console.log('No stored structure found for sheet:', sheetId);
        return null;
      }

      // Check if structure is fresh (less than 24 hours old)
      const timestamp = stored[`sheetStructure_timestamp_${sheetId}`];
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      if (timestamp < twentyFourHoursAgo) {
        console.log('Stored structure is stale, re-reading...');
        // Could trigger a background refresh here if needed
        return null;
      }

      return stored[`sheetStructure_${sheetId}`];
    } catch (error) {
      console.error('Error retrieving sheet structure:', error);
      return null;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
