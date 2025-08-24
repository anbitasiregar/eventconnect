/**
 * End-to-End Daily Usage Workflow Tests for EventConnect Extension
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../../popup/components/ErrorBoundary';
import { AuthProvider } from '../../popup/context/AuthContext';
import { EventProvider } from '../../popup/context/EventContext';
import { App } from '../../popup/components/App';
import { 
  mockSuccessfulOAuth, 
  mockSuccessfulSheetsAPI, 
  mockEventData,
  resetAllMocks 
} from '../mocks/google-api-mocks';

const TestApp = () => (
  <ErrorBoundary>
    <AuthProvider>
      <EventProvider>
        <App />
      </EventProvider>
    </AuthProvider>
  </ErrorBoundary>
);

describe('Daily Usage Workflows', () => {
  beforeEach(() => {
    resetAllMocks();
    // Mock Chrome APIs
    global.chrome = {
      ...global.chrome,
      tabs: {
        create: jest.fn()
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
          clear: jest.fn()
        },
        onChanged: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      }
    } as any;
  });

  describe('Event Status Check Flow', () => {
    it('should complete event status check workflow', async () => {
      // Setup: Mock authenticated user with current event
      const mockStorageData = {
        authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
        currentEventId: 'event-123'
      };
      
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys) => {
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (mockStorageData[key as keyof typeof mockStorageData]) {
              result[key] = mockStorageData[key as keyof typeof mockStorageData];
            }
          });
        }
        return Promise.resolve(result);
      });

      // Mock successful API responses
      mockSuccessfulSheetsAPI();
      
      // Mock message passing to background script
      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockImplementation((message) => {
          if (message.type === 'AUTH_STATUS') {
            return Promise.resolve({ authenticated: true });
          }
          if (message.type === 'GET_CURRENT_EVENT') {
            return Promise.resolve({ 
              event: { 
                id: 'event-123', 
                name: "Sarah's Wedding", 
                date: '2024-06-15',
                sheetsId: 'sheet-123'
              }
            });
          }
          if (message.type === 'READ_EVENT_DATA') {
            return Promise.resolve({ data: mockEventData });
          }
          return Promise.resolve({ success: true });
        })
      } as any;

      render(<TestApp />);

      // ✅ Wait for authenticated state and current event to load
      await waitFor(() => {
        expect(screen.getByText("Sarah's Wedding")).toBeInTheDocument();
      });

      // ✅ Click "View Event Status" button
      const statusButton = screen.getByText('View Event Status');
      fireEvent.click(statusButton);

      // ✅ Wait for status modal to appear with data from sheets
      await waitFor(() => {
        expect(screen.getByText('Event Status')).toBeInTheDocument();
        expect(screen.getByText('Budget Overview')).toBeInTheDocument();
      });

      // ✅ Verify data matches actual Google Sheet contents
      expect(screen.getByText('$25,000')).toBeInTheDocument(); // Total budget
      expect(screen.getByText('$18,500')).toBeInTheDocument(); // Spent
      expect(screen.getByText('$6,500')).toBeInTheDocument();  // Remaining

      // ✅ Verify task progress is displayed correctly
      expect(screen.getByText('23 of 45 completed')).toBeInTheDocument();
    });
  });

  describe('Quick Update Flow', () => {
    it('should complete quick update workflow', async () => {
      // Setup authenticated state with current event
      const mockStorageData = {
        authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
        currentEventId: 'event-123'
      };
      
      (chrome.storage.local.get as jest.Mock).mockResolvedValue(mockStorageData);

      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockImplementation((message) => {
          if (message.type === 'AUTH_STATUS') {
            return Promise.resolve({ authenticated: true });
          }
          if (message.type === 'GET_CURRENT_EVENT') {
            return Promise.resolve({ 
              event: { 
                id: 'event-123', 
                name: "Sarah's Wedding", 
                date: '2024-06-15',
                sheetsId: 'sheet-123'
              }
            });
          }
          if (message.type === 'APPEND_LOG') {
            return Promise.resolve({ success: true });
          }
          return Promise.resolve({ success: true });
        })
      } as any;

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText("Sarah's Wedding")).toBeInTheDocument();
      });

      // ✅ Click "Quick Update" button
      const updateButton = screen.getByText('Quick Update');
      fireEvent.click(updateButton);

      // ✅ Verify input field appears
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Add a quick note or update...')).toBeInTheDocument();
      });

      // ✅ Enter note/update and verify character count
      const textarea = screen.getByPlaceholderText('Add a quick note or update...');
      const testUpdate = 'Confirmed final headcount with catering - 150 guests';
      
      fireEvent.change(textarea, { target: { value: testUpdate } });
      
      expect(screen.getByText(`${testUpdate.length}/500 characters`)).toBeInTheDocument();

      // ✅ Submit update
      const addButton = screen.getByText('Add Update');
      fireEvent.click(addButton);

      // ✅ Verify success confirmation
      await waitFor(() => {
        expect(screen.getByText('Update added successfully!')).toBeInTheDocument();
      });

      // ✅ Verify API call was made with correct data
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'APPEND_LOG',
          payload: {
            sheetId: 'sheet-123',
            entry: testUpdate
          }
        })
      );
    });
  });

  describe('Next Tasks Flow', () => {
    it('should complete next tasks workflow', async () => {
      // Setup authenticated state
      const mockStorageData = {
        authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
        currentEventId: 'event-123'
      };
      
      (chrome.storage.local.get as jest.Mock).mockResolvedValue(mockStorageData);

      const mockTasks = [
        {
          id: 'task-1',
          name: 'Final dress fitting',
          dueDate: '2024-05-15',
          assignedTo: 'Sarah',
          priority: 'high' as const,
          status: 'pending' as const
        },
        {
          id: 'task-2',
          name: 'Confirm catering headcount',
          dueDate: '2024-05-20',
          assignedTo: 'Wedding Planner',
          priority: 'medium' as const,
          status: 'pending' as const
        }
      ];

      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockImplementation((message) => {
          if (message.type === 'AUTH_STATUS') {
            return Promise.resolve({ authenticated: true });
          }
          if (message.type === 'GET_CURRENT_EVENT') {
            return Promise.resolve({ 
              event: { 
                id: 'event-123', 
                name: "Sarah's Wedding", 
                date: '2024-06-15',
                sheetsId: 'sheet-123'
              }
            });
          }
          if (message.type === 'READ_EVENT_DATA') {
            return Promise.resolve({ 
              data: { 
                ...mockEventData,
                tasks: { 
                  ...mockEventData.tasks,
                  upcoming: mockTasks
                }
              }
            });
          }
          if (message.type === 'APPEND_LOG') {
            return Promise.resolve({ success: true });
          }
          return Promise.resolve({ success: true });
        })
      } as any;

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText("Sarah's Wedding")).toBeInTheDocument();
      });

      // ✅ Click "View Next Tasks" button
      const tasksButton = screen.getByText('View Next Tasks');
      fireEvent.click(tasksButton);

      // ✅ Wait for tasks modal to load
      await waitFor(() => {
        expect(screen.getByText('Upcoming Tasks')).toBeInTheDocument();
      });

      // ✅ Verify task list displays correctly and is sorted by priority/date
      expect(screen.getByText('Final dress fitting')).toBeInTheDocument();
      expect(screen.getByText('Confirm catering headcount')).toBeInTheDocument();
      
      // High priority task should appear first
      const tasks = screen.getAllByText(/high|medium/);
      expect(tasks[0]).toHaveTextContent('high');

      // ✅ Mark task complete
      const completeButtons = screen.getAllByTitle('Complete task');
      fireEvent.click(completeButtons[0]);

      // ✅ Verify UI updates immediately
      await waitFor(() => {
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'APPEND_LOG',
            payload: {
              sheetId: 'sheet-123',
              entry: 'Task completed: task-1'
            }
          })
        );
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle no internet connection gracefully', async () => {
      // Mock network failure
      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
      } as any;

      render(<TestApp />);

      // Should show appropriate error message
      await waitFor(() => {
        expect(screen.getByText(/Network error|connection/i)).toBeInTheDocument();
      });
    });

    it('should handle Google Sheets temporarily unavailable', async () => {
      const mockStorageData = {
        authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
        currentEventId: 'event-123'
      };
      
      (chrome.storage.local.get as jest.Mock).mockResolvedValue(mockStorageData);

      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockImplementation((message) => {
          if (message.type === 'AUTH_STATUS') {
            return Promise.resolve({ authenticated: true });
          }
          if (message.type === 'GET_CURRENT_EVENT') {
            return Promise.resolve({ 
              event: { 
                id: 'event-123', 
                name: "Sarah's Wedding", 
                date: '2024-06-15',
                sheetsId: 'sheet-123'
              }
            });
          }
          if (message.type === 'READ_EVENT_DATA') {
            return Promise.resolve({ error: 'Google Sheets temporarily unavailable' });
          }
          return Promise.resolve({ success: true });
        })
      } as any;

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText("Sarah's Wedding")).toBeInTheDocument();
      });

      // Try to view status
      const statusButton = screen.getByText('View Event Status');
      fireEvent.click(statusButton);

      // Should show retry mechanism
      await waitFor(() => {
        expect(screen.getByText(/temporarily unavailable|Try again/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid event sheet format', async () => {
      const mockStorageData = {
        authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
        currentEventId: 'event-123'
      };
      
      (chrome.storage.local.get as jest.Mock).mockResolvedValue(mockStorageData);

      global.chrome.runtime = {
        ...global.chrome.runtime,
        sendMessage: jest.fn().mockImplementation((message) => {
          if (message.type === 'READ_EVENT_DATA') {
            return Promise.resolve({ error: 'Sheet does not have the expected EventConnect structure' });
          }
          return Promise.resolve({ success: true, authenticated: true });
        })
      } as any;

      render(<TestApp />);

      // Should show clear error with help
      await waitFor(() => {
        expect(screen.getByText(/expected EventConnect structure/i)).toBeInTheDocument();
      });
    });
  });
});
