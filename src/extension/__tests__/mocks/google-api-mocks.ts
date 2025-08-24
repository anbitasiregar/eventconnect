/**
 * Google API Mocks for EventConnect Extension Testing
 */

export const mockGoogleSheetsAPI = {
  spreadsheets: {
    values: {
      get: jest.fn(),
      update: jest.fn(),
      append: jest.fn()
    },
    get: jest.fn()
  }
};

export const mockGoogleAuthAPI = {
  launchWebAuthFlow: jest.fn(),
  getAuthToken: jest.fn(),
  getRedirectURL: jest.fn(() => 'chrome-extension://test-extension-id/oauth')
};

export const mockEventData = {
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
        priority: "high" as const
      },
      {
        name: "Confirm catering headcount",
        dueDate: "2024-05-20",
        assignedTo: "Wedding Planner",
        priority: "medium" as const
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
      status: "completed" as const,
      assignedTo: "Sarah"
    }
  ]
};

export const mockSheetData = [
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

export const mockGoogleAuthToken = {
  access_token: 'mock_access_token_12345',
  refresh_token: 'mock_refresh_token_67890',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar',
  expires_at: Date.now() + 3600000
};

// Mock Chrome Identity API
export function mockChromeIdentity() {
  global.chrome = {
    ...global.chrome,
    identity: {
      launchWebAuthFlow: mockGoogleAuthAPI.launchWebAuthFlow,
      getAuthToken: mockGoogleAuthAPI.getAuthToken,
      getRedirectURL: mockGoogleAuthAPI.getRedirectURL
    }
  } as any;
}

// Mock successful OAuth flow
export function mockSuccessfulOAuth() {
  mockGoogleAuthAPI.launchWebAuthFlow.mockResolvedValue(
    'chrome-extension://test-extension-id/oauth#access_token=mock_access_token_12345&token_type=Bearer&expires_in=3600&scope=https://www.googleapis.com/auth/spreadsheets'
  );
}

// Mock failed OAuth flow
export function mockFailedOAuth(error = 'User cancelled') {
  mockGoogleAuthAPI.launchWebAuthFlow.mockRejectedValue(new Error(error));
}

// Mock successful Sheets API calls
export function mockSuccessfulSheetsAPI() {
  mockGoogleSheetsAPI.spreadsheets.get.mockResolvedValue({
    sheets: [
      { properties: { title: 'Event Overview' } },
      { properties: { title: 'Budget' } },
      { properties: { title: 'Timeline' } },
      { properties: { title: 'Vendors' } },
      { properties: { title: 'Guest List' } }
    ]
  });

  mockGoogleSheetsAPI.spreadsheets.values.get.mockImplementation((params: any) => {
    const range = params.range || '';
    if (range.includes('Event Overview')) {
      return Promise.resolve({ values: mockSheetData[0] });
    }
    if (range.includes('Budget')) {
      return Promise.resolve({ values: mockSheetData[3] });
    }
    if (range.includes('Timeline')) {
      return Promise.resolve({ values: mockSheetData[4] });
    }
    return Promise.resolve({ values: [] });
  });

  mockGoogleSheetsAPI.spreadsheets.values.update.mockResolvedValue({
    updatedCells: 1,
    updatedRows: 1
  });

  mockGoogleSheetsAPI.spreadsheets.values.append.mockResolvedValue({
    updates: {
      updatedCells: 1,
      updatedRows: 1
    }
  });
}

// Mock failed Sheets API calls
export function mockFailedSheetsAPI(error = 'Permission denied') {
  mockGoogleSheetsAPI.spreadsheets.values.get.mockRejectedValue(new Error(error));
  mockGoogleSheetsAPI.spreadsheets.values.update.mockRejectedValue(new Error(error));
  mockGoogleSheetsAPI.spreadsheets.values.append.mockRejectedValue(new Error(error));
}

// Reset all mocks
export function resetAllMocks() {
  jest.clearAllMocks();
  mockGoogleAuthAPI.launchWebAuthFlow.mockReset();
  mockGoogleAuthAPI.getAuthToken.mockReset();
  mockGoogleSheetsAPI.spreadsheets.values.get.mockReset();
  mockGoogleSheetsAPI.spreadsheets.values.update.mockReset();
  mockGoogleSheetsAPI.spreadsheets.values.append.mockReset();
  mockGoogleSheetsAPI.spreadsheets.get.mockReset();
}
