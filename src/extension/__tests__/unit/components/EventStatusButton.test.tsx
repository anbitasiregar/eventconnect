/**
 * Unit tests for EventStatusButton component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventStatusButton } from '../../../popup/components/actions/EventStatusButton';
import { EventProvider } from '../../../popup/context/EventContext';
import { AuthProvider } from '../../../popup/context/AuthContext';
import { mockEventData, resetAllMocks } from '../../mocks/google-api-mocks';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <EventProvider>
      {children}
    </EventProvider>
  </AuthProvider>
);

describe('EventStatusButton', () => {
  beforeEach(() => {
    resetAllMocks();
    global.chrome = {
      ...global.chrome,
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
      },
      runtime: {
        sendMessage: jest.fn()
      }
    } as any;
  });

  it('should load and display event status data', async () => {
    // Mock authenticated state with current event
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
      currentEventId: 'event-123'
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message) => {
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
    });

    render(
      <TestWrapper>
        <EventStatusButton />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('View Event Status')).toBeInTheDocument();
    });

    // Click the button
    fireEvent.click(screen.getByText('View Event Status'));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Event Status')).toBeInTheDocument();
      expect(screen.getByText("Sarah's Wedding")).toBeInTheDocument();
      expect(screen.getByText('Budget Overview')).toBeInTheDocument();
    });

    // Verify data is displayed correctly
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('$18,500')).toBeInTheDocument();
    expect(screen.getByText('$6,500')).toBeInTheDocument();
  });

  it('should handle loading states correctly', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
      currentEventId: 'event-123'
    });

    // Mock slow API response
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message) => {
      if (message.type === 'READ_EVENT_DATA') {
        return new Promise(resolve => {
          setTimeout(() => resolve({ data: mockEventData }), 1000);
        });
      }
      return Promise.resolve({ success: true, authenticated: true });
    });

    render(
      <TestWrapper>
        <EventStatusButton />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('View Event Status')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Event Status'));

    // Should show loading state
    expect(screen.getByText('View Event Status')).toBeDisabled();
  });

  it('should display error messages for failed requests', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
      currentEventId: 'event-123'
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message) => {
      if (message.type === 'READ_EVENT_DATA') {
        return Promise.resolve({ error: 'Failed to read event data' });
      }
      return Promise.resolve({ success: true, authenticated: true });
    });

    render(
      <TestWrapper>
        <EventStatusButton />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('View Event Status')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Event Status'));

    await waitFor(() => {
      expect(screen.getByText('Failed to read event data')).toBeInTheDocument();
    });
  });

  it('should be disabled when no current event is selected', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 }
      // No currentEventId
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message) => {
      if (message.type === 'GET_CURRENT_EVENT') {
        return Promise.resolve({ event: null });
      }
      return Promise.resolve({ success: true, authenticated: true });
    });

    render(
      <TestWrapper>
        <EventStatusButton />
      </TestWrapper>
    );

    await waitFor(() => {
      const button = screen.getByText('View Event Status');
      expect(button).toBeDisabled();
    });
  });

  it('should open status modal when data is loaded', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
      currentEventId: 'event-123'
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation((message) => {
      if (message.type === 'READ_EVENT_DATA') {
        return Promise.resolve({ data: mockEventData });
      }
      return Promise.resolve({ success: true, authenticated: true });
    });

    render(
      <TestWrapper>
        <EventStatusButton />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('View Event Status')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Event Status'));

    await waitFor(() => {
      expect(screen.getByText('Event Status')).toBeInTheDocument();
    });

    // Modal should be closeable
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Event Status')).not.toBeInTheDocument();
    });
  });
});
