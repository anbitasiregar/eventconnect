/**
 * Google Sheets Service for EventConnect Extension
 * Direct integration with Google Sheets API v4
 */

import { Logger } from '../shared/logger';

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
      const isValid = await this.validateSheetStructure(sheetId);
      if (!isValid) {
        throw new Error('Sheet does not have the expected EventConnect structure');
      }

      // Read different sections of the sheet
      const [overview, budget, tasks, vendors, timeline] = await Promise.all([
        this.readRange(sheetId, 'Event Overview!A:D'),
        this.readRange(sheetId, 'Budget!A:H'),
        this.readRange(sheetId, 'Timeline!A:G'),
        this.readRange(sheetId, 'Vendors!A:H'),
        this.readRange(sheetId, 'Timeline!A:G')
      ]);

      const eventData = this.parseEventData(overview, budget, tasks, vendors, timeline);
      
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
   * Validate that sheet has expected EventConnect structure
   */
  async validateSheetStructure(sheetId: string): Promise<boolean> {
    try {
      Logger.debug(`Validating sheet structure: ${sheetId}`);

      // Check for required worksheets
      const metadata = await this.getSheetMetadata(sheetId);
      const sheetNames = metadata.sheets?.map((sheet: any) => sheet.properties.title) || [];

      const requiredSheets = ['Event Overview', 'Budget', 'Timeline', 'Vendors', 'Guest List'];
      const hasRequiredSheets = requiredSheets.every(name => sheetNames.includes(name));

      if (!hasRequiredSheets) {
        Logger.warn('Sheet missing required worksheets', { 
          found: sheetNames, 
          required: requiredSheets 
        });
        return false;
      }

      // Validate Event Overview structure
      const overviewData = await this.readRange(sheetId, 'Event Overview!A1:B7');
      const hasOverviewStructure = overviewData.length >= 6 && 
                                  overviewData[0][0] === 'Event Name';

      if (!hasOverviewStructure) {
        Logger.warn('Event Overview worksheet has incorrect structure');
        return false;
      }

      Logger.debug('Sheet structure validation passed');
      return true;

    } catch (error) {
      Logger.error('Sheet structure validation failed', error as Error);
      return false;
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
   * Parse raw sheet data into EventData structure
   */
  private parseEventData(
    overview: any[][],
    budget: any[][],
    tasks: any[][],
    vendors: any[][],
    timeline: any[][]
  ): EventData {
    // Parse overview data
    const eventName = overview[0]?.[1] || 'Untitled Event';
    const eventDate = overview[1]?.[1] || '';

    // Parse budget data
    const budgetTotal = this.parseNumber(overview.find(row => row[0] === 'Total Budget')?.[1]) || 0;
    const budgetSpent = budget.slice(1).reduce((sum, row) => sum + this.parseNumber(row[3]), 0);
    const budgetRemaining = budgetTotal - budgetSpent;

    // Parse tasks data
    const taskRows = tasks.slice(1).filter(row => row[0]);
    const completedTasks = taskRows.filter(row => row[3] === 'Completed').length;
    const upcomingTasks = taskRows
      .filter(row => row[3] !== 'Completed')
      .slice(0, 5)
      .map(row => ({
        name: row[0] || '',
        dueDate: row[1] || '',
        assignedTo: row[2] || '',
        priority: (row[4] || 'medium') as 'high' | 'medium' | 'low'
      }));

    // Parse vendor data
    const vendorRows = vendors.slice(1).filter(row => row[0]);
    const vendorContacts = vendorRows.map(row => ({
      name: row[0] || '',
      category: row[1] || '',
      contact: row[2] || '',
      email: row[3] || '',
      phone: row[4] || '',
      status: row[5] || 'pending'
    }));

    // Parse timeline data
    const timelineRows = timeline.slice(1).filter(row => row[0]);
    const timelineItems = timelineRows.map(row => ({
      task: row[0] || '',
      dueDate: row[1] || '',
      status: (row[3] || 'pending') as 'pending' | 'in_progress' | 'completed',
      assignedTo: row[2] || ''
    }));

    return {
      eventName,
      eventDate,
      budget: {
        total: budgetTotal,
        spent: budgetSpent,
        remaining: budgetRemaining
      },
      tasks: {
        completed: completedTasks,
        total: taskRows.length,
        upcoming: upcomingTasks
      },
      vendors: vendorContacts,
      timeline: timelineItems
    };
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
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
