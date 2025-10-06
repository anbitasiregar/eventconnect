"use strict";
/**
 * Google API Mocks for EventConnect Extension Testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockGoogleAuthToken = exports.mockSheetData = exports.mockEventData = exports.mockGoogleAuthAPI = exports.mockGoogleSheetsAPI = void 0;
exports.mockChromeIdentity = mockChromeIdentity;
exports.mockSuccessfulOAuth = mockSuccessfulOAuth;
exports.mockFailedOAuth = mockFailedOAuth;
exports.mockSuccessfulSheetsAPI = mockSuccessfulSheetsAPI;
exports.mockFailedSheetsAPI = mockFailedSheetsAPI;
exports.resetAllMocks = resetAllMocks;
exports.mockGoogleSheetsAPI = {
    spreadsheets: {
        values: {
            get: jest.fn(),
            update: jest.fn(),
            append: jest.fn()
        },
        get: jest.fn()
    }
};
exports.mockGoogleAuthAPI = {
    launchWebAuthFlow: jest.fn(),
    getAuthToken: jest.fn(),
    getRedirectURL: jest.fn(() => 'chrome-extension://test-extension-id/oauth')
};
exports.mockEventData = {
    eventName: "Sarah's Wedding",
    eventDate: "2024-06-15",
    budget: {
        total: 25000,
        spent: 18500,
        remaining: 6500
    },
    tasks: {
        completed: 23,
        total: 45,
        upcoming: [
            {
                name: "Final dress fitting",
                dueDate: "2024-05-15",
                assignedTo: "Sarah",
                priority: "high"
            },
            {
                name: "Confirm catering headcount",
                dueDate: "2024-05-20",
                assignedTo: "Wedding Planner",
                priority: "medium"
            }
        ]
    },
    vendors: [
        {
            name: "Elegant Catering Co.",
            category: "Catering",
            contact: "John Smith",
            email: "john@elegantcatering.com",
            phone: "(555) 123-4567",
            status: "confirmed"
        }
    ],
    timeline: [
        {
            task: "Send invitations",
            dueDate: "2024-04-01",
            status: "completed",
            assignedTo: "Sarah"
        }
    ]
};
exports.mockSheetData = [
    [['Event Name', "Sarah's Wedding"]],
    [['Event Date', '2024-06-15']],
    [['Total Budget', '25000']],
    // Budget data
    [
        ['Category', 'Item', 'Estimated Cost', 'Actual Cost', 'Vendor', 'Status'],
        ['Catering', 'Wedding dinner', '12000', '11500', 'Elegant Catering Co.', 'Confirmed'],
        ['Venue', 'Reception hall', '8000', '8000', 'Grand Ballroom', 'Confirmed']
    ],
    // Timeline data
    [
        ['Task', 'Due Date', 'Assigned To', 'Status', 'Priority'],
        ['Send invitations', '2024-04-01', 'Sarah', 'Completed', 'High'],
        ['Final dress fitting', '2024-05-15', 'Sarah', 'Pending', 'High']
    ]
];
exports.mockGoogleAuthToken = {
    access_token: 'mock_access_token_12345',
    refresh_token: 'mock_refresh_token_67890',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar',
    expires_at: Date.now() + 3600000
};
// Mock Chrome Identity API
function mockChromeIdentity() {
    global.chrome = {
        ...global.chrome,
        identity: {
            launchWebAuthFlow: exports.mockGoogleAuthAPI.launchWebAuthFlow,
            getAuthToken: exports.mockGoogleAuthAPI.getAuthToken,
            getRedirectURL: exports.mockGoogleAuthAPI.getRedirectURL
        }
    };
}
// Mock successful OAuth flow
function mockSuccessfulOAuth() {
    exports.mockGoogleAuthAPI.launchWebAuthFlow.mockResolvedValue('chrome-extension://test-extension-id/oauth#access_token=mock_access_token_12345&token_type=Bearer&expires_in=3600&scope=https://www.googleapis.com/auth/spreadsheets');
}
// Mock failed OAuth flow
function mockFailedOAuth(error = 'User cancelled') {
    exports.mockGoogleAuthAPI.launchWebAuthFlow.mockRejectedValue(new Error(error));
}
// Mock successful Sheets API calls
function mockSuccessfulSheetsAPI() {
    exports.mockGoogleSheetsAPI.spreadsheets.get.mockResolvedValue({
        sheets: [
            { properties: { title: 'Event Overview' } },
            { properties: { title: 'Budget' } },
            { properties: { title: 'Timeline' } },
            { properties: { title: 'Vendors' } },
            { properties: { title: 'Guest List' } }
        ]
    });
    exports.mockGoogleSheetsAPI.spreadsheets.values.get.mockImplementation((params) => {
        const range = params.range || '';
        if (range.includes('Event Overview')) {
            return Promise.resolve({ values: exports.mockSheetData[0] });
        }
        if (range.includes('Budget')) {
            return Promise.resolve({ values: exports.mockSheetData[3] });
        }
        if (range.includes('Timeline')) {
            return Promise.resolve({ values: exports.mockSheetData[4] });
        }
        return Promise.resolve({ values: [] });
    });
    exports.mockGoogleSheetsAPI.spreadsheets.values.update.mockResolvedValue({
        updatedCells: 1,
        updatedRows: 1
    });
    exports.mockGoogleSheetsAPI.spreadsheets.values.append.mockResolvedValue({
        updates: {
            updatedCells: 1,
            updatedRows: 1
        }
    });
}
// Mock failed Sheets API calls
function mockFailedSheetsAPI(error = 'Permission denied') {
    exports.mockGoogleSheetsAPI.spreadsheets.values.get.mockRejectedValue(new Error(error));
    exports.mockGoogleSheetsAPI.spreadsheets.values.update.mockRejectedValue(new Error(error));
    exports.mockGoogleSheetsAPI.spreadsheets.values.append.mockRejectedValue(new Error(error));
}
// Reset all mocks
function resetAllMocks() {
    jest.clearAllMocks();
    exports.mockGoogleAuthAPI.launchWebAuthFlow.mockReset();
    exports.mockGoogleAuthAPI.getAuthToken.mockReset();
    exports.mockGoogleSheetsAPI.spreadsheets.values.get.mockReset();
    exports.mockGoogleSheetsAPI.spreadsheets.values.update.mockReset();
    exports.mockGoogleSheetsAPI.spreadsheets.values.append.mockReset();
    exports.mockGoogleSheetsAPI.spreadsheets.get.mockReset();
}
//# sourceMappingURL=google-api-mocks.js.map