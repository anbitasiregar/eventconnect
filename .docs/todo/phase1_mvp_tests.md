# Phase 1: Core Launch Requirements (MVP) - Tests

This document outlines the tests written for Phase 1 of the MVP.

## Testing Suite 1: Chrome Extension Foundation
**Goals:**
- Ensure reliable extension functionality across core user flows
- Validate Google OAuth integration and permissions
- Test Chrome extension-specific behaviors and edge cases
- Establish testing foundation for future AI feature integration

**Testing Strategy:**
- **Unit Tests:** Individual component and utility function testing
- **Integration Tests:** Extension component communication and Google API integration
- **End-to-End Tests:** Complete user workflows from authentication to action execution
- **Manual Testing:** Chrome extension-specific scenarios and cross-browser compatibility

**Files & Context:**
- Test setup: `src/extension/__tests__/`
- Test utilities: `src/extension/__tests__/utils/`
- Mock data: `src/extension/__tests__/mocks/`
- E2E tests: `src/extension/__tests__/e2e/`

**Tasks:**

1. **Unit Tests (`src/extension/__tests__/unit/`):**

   **Storage Utilities Tests (`storage.test.ts`):**
   - ✅ `setStorageItem()` successfully stores data
   - ✅ `getStorageItem()` retrieves correct data
   - ✅ `getStorageItem()` returns null for non-existent keys
   - ✅ `clearStorage()` removes all stored data
   - ❌ Storage operations handle Chrome API failures gracefully
   - ❌ Invalid data types are rejected with proper error messages

   **Message Passing Tests (`messaging.test.ts`):**
   - ✅ `sendMessageToBackground()` delivers messages correctly
   - ✅ Message listeners receive and process messages
   - ✅ Message responses are returned properly
   - ❌ Invalid message formats are rejected
   - ❌ Timeout handling for unresponsive receivers
   - ❌ Error propagation between extension components

   **Authentication Hook Tests (`useAuth.test.ts`):**
   - ✅ `useAuth()` returns correct initial authentication state
   - ✅ `login()` triggers OAuth flow and updates state
   - ✅ `logout()` clears authentication and updates state
   - ✅ Token refresh works automatically
   - ❌ Failed authentication shows appropriate error states
   - ❌ Network errors during auth are handled gracefully

   **Event Data Hook Tests (`useEventData.test.ts`):**
   - ✅ `useEventData()` loads event data from Google Sheets
   - ✅ `updateEventData()` writes changes to sheets correctly
   - ✅ Loading states are managed properly
   - ❌ Invalid sheet access shows appropriate error messages
   - ❌ Network failures during sheet operations are handled
   - ❌ Permission errors are displayed user-friendly

2. **Integration Tests (`src/extension/__tests__/integration/`):**

   **Google OAuth Integration (`google-auth.integration.test.ts`):**
   - ✅ Complete OAuth flow from start to token storage
   - ✅ Token refresh before expiration works correctly
   - ✅ Multiple permission scopes are requested and granted
   - ✅ Authentication state persists across extension restarts
   - ❌ OAuth cancellation by user is handled gracefully
   - ❌ Invalid credentials are rejected with clear errors
   - ❌ Network interruption during OAuth shows retry options
   - ❌ Permission denial scenarios are handled properly

   **Google Sheets API Integration (`sheets-api.integration.test.ts`):**
   - ✅ Reading event data from existing Google Sheet works
   - ✅ Writing updates to Google Sheet reflects changes
   - ✅ Sheet selection and validation works correctly
   - ✅ Real-time sync between extension and sheets
   - ❌ Invalid sheet format shows helpful error messages
   - ❌ Permission-denied sheets are handled gracefully
   - ❌ API quota exceeded scenarios are managed properly
   - ❌ Network timeouts during sheet operations show retry options

   **Extension Component Communication (`component-communication.integration.test.ts`):**
   - ✅ Popup to background script communication works
   - ✅ Background to content script messaging works
   - ✅ Content script to background communication works
   - ✅ Message routing handles different message types correctly
   - ❌ Component crash doesn't break entire extension
   - ❌ Invalid messages are rejected without crashing
   - ❌ High message volume is handled without performance issues

3. **End-to-End User Flow Tests (`src/extension/__tests__/e2e/`):**

   **First-Time User Onboarding (`onboarding.e2e.test.ts`):**
   - ✅ **Complete Success Flow:**
     1. Install extension → Shows onboarding prompt
     2. Click "Get Started" → Opens web app
     3. Complete Google OAuth → Permissions granted
     4. Select existing Google Sheet → Validation passes
     5. Return to extension → Shows authenticated state
     6. Action buttons are enabled and functional
   
   - ❌ **Incomplete Onboarding Scenarios:**
     * User closes web app during OAuth → Extension shows incomplete setup
     * User denies Google permissions → Clear error message with retry option
     * User selects invalid/inaccessible sheet → Validation error with selection retry
     * Network failure during setup → Offline error with resume capability

   **Daily Usage Workflows (`daily-usage.e2e.test.ts`):**
   - ✅ **Event Status Check Flow:**
     1. Open extension popup → Shows current event
     2. Click "View Event Status" → Loads data from sheets
     3. Display budget, deadlines, tasks → Formatted correctly
     4. Data matches actual Google Sheet contents
   
   - ✅ **Quick Update Flow:**
     1. Click "Quick Update" → Shows input field
     2. Enter note/update → Character count and validation work
     3. Submit update → Writes to Google Sheet
     4. Confirmation shown → Sheet reflects new entry with timestamp
   
   - ✅ **Next Tasks Flow:**
     1. Click "View Next Tasks" → Loads upcoming items
     2. Task list displays correctly → Sorted by priority/date
     3. Mark task complete → Updates Google Sheet status
     4. UI updates immediately → Reflects completed state

   - ❌ **Error Scenarios:**
     * No internet connection → Graceful offline message
     * Google Sheets temporarily unavailable → Retry mechanism
     * Invalid event sheet format → Clear error with help link
     * Token expired during operation → Automatic re-authentication

   **Content Script Context Detection (`content-script.e2e.test.ts`):**
   - ✅ **Event Site Detection:**
     1. Navigate to venue website → Extension detects event-related content
     2. Page context stored correctly → URL, title, domain captured
     3. Extension popup shows contextual awareness → "Event-related site detected"
   
   - ✅ **Non-Event Site Behavior:**
     1. Navigate to general website → No special detection
     2. Extension functions normally → All buttons work as expected
   
   - ❌ **Content Script Failures:**
     * Host page has CSP restrictions → Extension still functions
     * JavaScript errors on host page → Content script isolated and stable

4. **Manual Testing Checklist (`src/extension/__tests__/manual/`):**

   **Chrome Extension Specific Tests (`chrome-extension-manual.md`):**
   - ✅ Extension installs correctly in Chrome Developer Mode
   - ✅ Popup opens and closes smoothly
   - ✅ Extension icon shows correct state (authenticated/unauthenticated)
   - ✅ Extension survives browser restart and maintains state
   - ✅ Extension works correctly after Chrome updates
   - ❌ Extension handles Chrome crashes gracefully
   - ❌ Multiple Chrome profiles work independently
   - ❌ Extension permissions can be managed through Chrome settings

   **Cross-Browser Compatibility (`cross-browser-manual.md`):**
   - ✅ Extension works in Chrome (primary target)
   - ✅ Extension works in Microsoft Edge (Chromium-based)
   - ❌ Extension handles browser-specific API differences
   - ❌ Manifest V3 compliance across browsers

   **Performance and Resource Usage (`performance-manual.md`):**
   - ✅ Extension popup loads quickly (< 1 second)
   - ✅ Content script has minimal performance impact on host pages
   - ✅ Background script doesn't consume excessive memory
   - ✅ Google API calls complete within reasonable time (< 3 seconds)
   - ❌ Extension works smoothly with limited system resources
   - ❌ Large Google Sheets don't cause performance issues

5. **Test Data Setup and Mocks (`src/extension/__tests__/mocks/`):**

   **Google Sheets Mock Data (`sheets-mock-data.ts`):**
   ```typescript
   export const mockEventSheet = {
     eventName: "Sarah's Wedding",
     budget: { total: 25000, spent: 18500, remaining: 6500 },
     nextDeadlines: [
       { task: "Final headcount", dueDate: "2024-02-15", priority: "high" },
       { task: "Venue final payment", dueDate: "2024-02-20", priority: "medium" }
     ],
     tasks: { completed: 23, total: 45, inProgress: 8 }
   };
   ```

   **Chrome API Mocks (`chrome-mocks.ts`):**
   ```typescript
   export const mockChromeStorage = {
     local: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
     sync: { get: jest.fn(), set: jest.fn() }
   };
   
   export const mockChromeIdentity = {
     launchWebAuthFlow: jest.fn().mockResolvedValue('mock-oauth-token')
   };
   ```

6. **Test Automation Setup (`src/extension/__tests__/setup/`):**

   **Jest Configuration (`jest.config.js`):**
   - Configure Jest for Chrome extension environment
   - Set up Chrome API mocks globally
   - Configure TypeScript compilation for tests
   - Set up coverage reporting for components and utilities

   **Test Environment Setup (`test-setup.ts`):**
   - Mock Chrome extension APIs
   - Set up React Testing Library
   - Configure mock Google APIs
   - Initialize test database/storage

**Success Criteria for MVP Testing:**
- ✅ **90%+ test coverage** for critical paths (authentication, core actions)
- ✅ **All E2E happy paths** pass consistently
- ✅ **Error handling** gracefully manages top 5 failure scenarios
- ✅ **Performance benchmarks** meet targets (popup < 1s, API calls < 3s)
- ✅ **Manual testing** covers Chrome-specific behaviors

**Testing Timeline Integration:**
- **Week 1:** Set up testing infrastructure alongside core development
- **Week 2:** Write unit tests as components are built
- **Week 3:** Integration tests and E2E happy paths
- **Week 4:** Error scenario testing and manual testing checklist

---

## Simplified File Structure for MVP Testing:

```
src/extension/__tests__/
├── unit/
│   ├── storage.test.ts                 # Chrome storage utilities
│   ├── messaging.test.ts               # Message passing system
│   ├── useAuth.test.ts                 # Authentication hook
│   └── useEventData.test.ts            # Event data hook
├── integration/
│   ├── google-auth.integration.test.ts # OAuth flow testing
│   ├── sheets-api.integration.test.ts  # Google Sheets integration
│   └── component-communication.integration.test.ts # Extension messaging
├── e2e/
│   ├── onboarding.e2e.test.ts          # First-time user flow
│   ├── daily-usage.e2e.test.ts         # Core action button flows
│   └── content-script.e2e.test.ts      # Context detection
├── manual/
│   ├── chrome-extension-manual.md      # Chrome-specific testing
│   ├── cross-browser-manual.md         # Browser compatibility
│   └── performance-manual.md           # Performance validation
├── mocks/
│   ├── sheets-mock-data.ts             # Sample event data
│   ├── chrome-mocks.ts                 # Chrome API mocks
│   └── google-api-mocks.ts             # Google API responses
└── setup/
    ├── jest.config.js                  # Jest configuration
    ├── test-setup.ts                   # Test environment setup
    └── test-utils.tsx                  # Testing utilities
```

This testing approach ensures the Chrome extension foundation is robust and reliable while maintaining focus on MVP simplicity and core user value delivery.

