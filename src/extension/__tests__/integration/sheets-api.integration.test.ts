/**
 * Google Sheets API Integration Tests for EventConnect Extension
 */

import { GoogleSheetsService } from '../../background/sheets-service';
import { 
  mockSuccessfulSheetsAPI, 
  mockFailedSheetsAPI, 
  mockEventData,
  resetAllMocks 
} from '../mocks/google-api-mocks';

describe('Google Sheets API Integration', () => {
  let sheetsService: GoogleSheetsService;
  const mockGetToken = jest.fn();

  beforeEach(() => {
    resetAllMocks();
    mockGetToken.mockResolvedValue('mock_access_token');
    sheetsService = new GoogleSheetsService(mockGetToken);
    
    // Mock global fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Reading event data from existing Google Sheet', () => {
    it('should read event data successfully', async () => {
      // Mock successful API responses
      const mockResponses = [
        // Sheet metadata
        { 
          ok: true, 
          json: () => Promise.resolve({
            sheets: [
              { properties: { title: 'Event Overview' } },
              { properties: { title: 'Budget' } },
              { properties: { title: 'Timeline' } },
              { properties: { title: 'Vendors' } },
              { properties: { title: 'Guest List' } }
            ]
          })
        },
        // Event Overview data
        { 
          ok: true, 
          json: () => Promise.resolve({
            values: [
              ['Event Name', "Sarah's Wedding"],
              ['Event Date', '2024-06-15'],
              ['Total Budget', '25000']
            ]
          })
        },
        // Budget data
        { 
          ok: true, 
          json: () => Promise.resolve({
            values: [
              ['Category', 'Item', 'Estimated Cost', 'Actual Cost'],
              ['Catering', 'Wedding dinner', '12000', '11500'],
              ['Venue', 'Reception hall', '8000', '8000']
            ]
          })
        },
        // Timeline data (used twice)
        { 
          ok: true, 
          json: () => Promise.resolve({
            values: [
              ['Task', 'Due Date', 'Assigned To', 'Status'],
              ['Send invitations', '2024-04-01', 'Sarah', 'Completed'],
              ['Final dress fitting', '2024-05-15', 'Sarah', 'Pending']
            ]
          })
        },
        // Vendors data
        { 
          ok: true, 
          json: () => Promise.resolve({
            values: [
              ['Name', 'Category', 'Contact', 'Email', 'Phone', 'Status'],
              ['Elegant Catering Co.', 'Catering', 'John Smith', 'john@elegantcatering.com', '555-123-4567', 'confirmed']
            ]
          })
        }
      ];

      let callIndex = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        const response = mockResponses[callIndex % mockResponses.length];
        callIndex++;
        return Promise.resolve(response);
      });

      const eventData = await sheetsService.readEventSheet('test-sheet-id');

      expect(eventData.eventName).toBe("Sarah's Wedding");
      expect(eventData.eventDate).toBe('2024-06-15');
      expect(eventData.budget.total).toBe(25000);
      expect(eventData.budget.spent).toBeGreaterThan(0);
      expect(eventData.vendors).toHaveLength(1);
      expect(eventData.timeline).toHaveLength(2);

      // Verify API calls were made with correct authentication
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-sheet-id'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_access_token'
          })
        })
      );
    });

    it('should handle invalid sheet format with helpful error', async () => {
      // Mock sheet with missing required worksheets
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { title: 'Sheet1' } }
          ]
        })
      });

      await expect(sheetsService.readEventSheet('invalid-sheet-id'))
        .rejects.toThrow('Sheet does not have the expected EventConnect structure');
    });

    it('should handle permission-denied sheets gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(sheetsService.readEventSheet('forbidden-sheet-id'))
        .rejects.toThrow('Failed to read event data');
    });
  });

  describe('Writing updates to Google Sheet', () => {
    it('should update event data successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ updatedCells: 1 })
      });

      const updates = {
        eventName: 'Updated Wedding Name',
        budget: { total: 30000, spent: 20000, remaining: 10000 }
      };

      await expect(sheetsService.updateEventData('test-sheet-id', updates))
        .resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-sheet-id/values'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_access_token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API quota exceeded scenarios', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(sheetsService.updateEventData('test-sheet-id', {}))
        .rejects.toThrow('Failed to update event data');
    });
  });

  describe('Sheet validation', () => {
    it('should validate sheet structure correctly', async () => {
      // Mock valid sheet structure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            sheets: [
              { properties: { title: 'Event Overview' } },
              { properties: { title: 'Budget' } },
              { properties: { title: 'Timeline' } },
              { properties: { title: 'Vendors' } },
              { properties: { title: 'Guest List' } }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            values: [
              ['Event Name', 'Test Event'],
              ['Event Date', '2024-01-01']
            ]
          })
        });

      const isValid = await sheetsService.validateSheetStructure('valid-sheet-id');
      expect(isValid).toBe(true);
    });

    it('should reject sheets with incorrect structure', async () => {
      // Mock invalid sheet structure
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { title: 'Sheet1' } }
          ]
        })
      });

      const isValid = await sheetsService.validateSheetStructure('invalid-sheet-id');
      expect(isValid).toBe(false);
    });
  });

  describe('Append to event log', () => {
    it('should append log entry successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          updates: { updatedCells: 1, updatedRows: 1 } 
        })
      });

      await expect(sheetsService.appendToEventLog('test-sheet-id', 'Test log entry'))
        .resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test-sheet-id/values/Event Log!A:C:append'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test log entry')
        })
      );
    });
  });

  describe('Network timeout scenarios', () => {
    it('should handle network timeouts with retry options', async () => {
      // Mock network timeout
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });

      // This should succeed after retries
      await expect(sheetsService.validateSheetStructure('test-sheet-id'))
        .resolves.toBe(false); // Will be false due to empty values, but won't throw

      // Verify retries were attempted
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retries', async () => {
      // Mock persistent network failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent network error'));

      await expect(sheetsService.validateSheetStructure('test-sheet-id'))
        .rejects.toThrow('Persistent network error');

      // Verify maximum retries were attempted
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Real-time sync capabilities', () => {
    it('should handle concurrent read/write operations', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ values: [], updatedCells: 1 })
      });

      // Simulate concurrent operations
      const readPromise = sheetsService.validateSheetStructure('test-sheet-id');
      const writePromise = sheetsService.appendToEventLog('test-sheet-id', 'Concurrent update');

      await expect(Promise.all([readPromise, writePromise]))
        .resolves.toEqual([false, undefined]);

      // Both operations should have been attempted
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
