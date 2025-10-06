"use strict";
/**
 * Unit tests for EventStatusButton component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const EventStatusButton_1 = require("../../../popup/components/actions/EventStatusButton");
const EventContext_1 = require("../../../popup/context/EventContext");
const AuthContext_1 = require("../../../popup/context/AuthContext");
const google_api_mocks_1 = require("../../mocks/google-api-mocks");
const TestWrapper = ({ children }) => (<AuthContext_1.AuthProvider>
    <EventContext_1.EventProvider>
      {children}
    </EventContext_1.EventProvider>
  </AuthContext_1.AuthProvider>);
describe('EventStatusButton', () => {
    beforeEach(() => {
        (0, google_api_mocks_1.resetAllMocks)();
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
        };
    });
    it('should load and display event status data', async () => {
        // Mock authenticated state with current event
        chrome.storage.local.get.mockResolvedValue({
            authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
            currentEventId: 'event-123'
        });
        chrome.runtime.sendMessage.mockImplementation((message) => {
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
                return Promise.resolve({ data: google_api_mocks_1.mockEventData });
            }
            return Promise.resolve({ success: true });
        });
        (0, react_2.render)(<TestWrapper>
        <EventStatusButton_1.EventStatusButton />
      </TestWrapper>);
        // Wait for component to load
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('View Event Status')).toBeInTheDocument();
        });
        // Click the button
        react_2.fireEvent.click(react_2.screen.getByText('View Event Status'));
        // Wait for modal to appear
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Event Status')).toBeInTheDocument();
            expect(react_2.screen.getByText("Sarah's Wedding")).toBeInTheDocument();
            expect(react_2.screen.getByText('Budget Overview')).toBeInTheDocument();
        });
        // Verify data is displayed correctly
        expect(react_2.screen.getByText('$25,000')).toBeInTheDocument();
        expect(react_2.screen.getByText('$18,500')).toBeInTheDocument();
        expect(react_2.screen.getByText('$6,500')).toBeInTheDocument();
    });
    it('should handle loading states correctly', async () => {
        chrome.storage.local.get.mockResolvedValue({
            authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
            currentEventId: 'event-123'
        });
        // Mock slow API response
        chrome.runtime.sendMessage.mockImplementation((message) => {
            if (message.type === 'READ_EVENT_DATA') {
                return new Promise(resolve => {
                    setTimeout(() => resolve({ data: google_api_mocks_1.mockEventData }), 1000);
                });
            }
            return Promise.resolve({ success: true, authenticated: true });
        });
        (0, react_2.render)(<TestWrapper>
        <EventStatusButton_1.EventStatusButton />
      </TestWrapper>);
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('View Event Status')).toBeInTheDocument();
        });
        react_2.fireEvent.click(react_2.screen.getByText('View Event Status'));
        // Should show loading state
        expect(react_2.screen.getByText('View Event Status')).toBeDisabled();
    });
    it('should display error messages for failed requests', async () => {
        chrome.storage.local.get.mockResolvedValue({
            authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
            currentEventId: 'event-123'
        });
        chrome.runtime.sendMessage.mockImplementation((message) => {
            if (message.type === 'READ_EVENT_DATA') {
                return Promise.resolve({ error: 'Failed to read event data' });
            }
            return Promise.resolve({ success: true, authenticated: true });
        });
        (0, react_2.render)(<TestWrapper>
        <EventStatusButton_1.EventStatusButton />
      </TestWrapper>);
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('View Event Status')).toBeInTheDocument();
        });
        react_2.fireEvent.click(react_2.screen.getByText('View Event Status'));
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Failed to read event data')).toBeInTheDocument();
        });
    });
    it('should be disabled when no current event is selected', async () => {
        chrome.storage.local.get.mockResolvedValue({
            authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 }
            // No currentEventId
        });
        chrome.runtime.sendMessage.mockImplementation((message) => {
            if (message.type === 'GET_CURRENT_EVENT') {
                return Promise.resolve({ event: null });
            }
            return Promise.resolve({ success: true, authenticated: true });
        });
        (0, react_2.render)(<TestWrapper>
        <EventStatusButton_1.EventStatusButton />
      </TestWrapper>);
        await (0, react_2.waitFor)(() => {
            const button = react_2.screen.getByText('View Event Status');
            expect(button).toBeDisabled();
        });
    });
    it('should open status modal when data is loaded', async () => {
        chrome.storage.local.get.mockResolvedValue({
            authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
            currentEventId: 'event-123'
        });
        chrome.runtime.sendMessage.mockImplementation((message) => {
            if (message.type === 'READ_EVENT_DATA') {
                return Promise.resolve({ data: google_api_mocks_1.mockEventData });
            }
            return Promise.resolve({ success: true, authenticated: true });
        });
        (0, react_2.render)(<TestWrapper>
        <EventStatusButton_1.EventStatusButton />
      </TestWrapper>);
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('View Event Status')).toBeInTheDocument();
        });
        react_2.fireEvent.click(react_2.screen.getByText('View Event Status'));
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.getByText('Event Status')).toBeInTheDocument();
        });
        // Modal should be closeable
        const closeButton = react_2.screen.getByLabelText('Close modal');
        react_2.fireEvent.click(closeButton);
        await (0, react_2.waitFor)(() => {
            expect(react_2.screen.queryByText('Event Status')).not.toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=EventStatusButton.test.js.map