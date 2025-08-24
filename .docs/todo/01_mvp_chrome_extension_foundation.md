# Backlog Item 1: Chrome Extension Foundation (MVP)

**Business Goal:** Create the primary user interface as a simple Chrome extension with essential action buttons that provides immediate value through basic event management actions. Focus on simplicity and clean code while establishing the foundation for EventConnect's Chrome extension-first architecture.

**Key Features:**
- Manifest V3 Chrome extension with popup interface
- React-based UI with 2-3 essential action buttons
- Minimal content script for basic page detection
- Service worker for Google OAuth and simple API communication
- Chrome storage for essential user data only
- Clean foundation for future AI enhancements (Phase 2)

---
## Technical Breakdown & Tasks:

### Part A: Chrome Extension Core Structure & Manifest V3 Setup
**Goals:**
- Set up Manifest V3 Chrome extension structure with proper permissions
- Configure build system for React development in extension environment
- Establish secure communication patterns between extension components
- Implement Chrome storage for user data and preferences

**Files & Context:**
- Extension root: `src/extension/`
- Manifest: `src/extension/manifest.json`
- Build config: `src/extension/webpack.config.js`
- Background: `src/extension/background/service-worker.ts`
- Content: `src/extension/content/content-script.ts`
- Popup: `src/extension/popup/` (React components)

**Tasks:**
1. **Manifest V3 Configuration (`src/extension/manifest.json`):**
   * Create Manifest V3 compliant configuration:
     * `"manifest_version": 3`
     * `"name": "EventConnect - AI Event Planning Assistant"`
     * `"version": "1.0.0"`
     * `"description": "Chrome extension-first event planning with Google Sheets integration"`
   * **Permissions:**
     * `"activeTab"` - for contextual webpage analysis
     * `"storage"` - for user preferences and session data
     * `"identity"` - for Google OAuth integration
     * `"scripting"` - for content script injection
   * **Host Permissions:**
     * `"https://sheets.googleapis.com/*"` - Google Sheets API
     * `"https://www.googleapis.com/*"` - Google APIs
     * `"http://localhost:3000/*"` - Local development backend
   * **Action Configuration:**
     * `"action": {"default_popup": "popup/index.html", "default_title": "EventConnect"}`
   * **Background Service Worker:**
     * `"background": {"service_worker": "background/service-worker.js", "type": "module"}`
   * **Content Scripts:**
     * `"content_scripts": [{"matches": ["<all_urls>"], "js": ["content/content-script.js"], "run_at": "document_idle"}]`
   * **Web Accessible Resources:** Configure for React assets and icons

2. **Build System Configuration (`src/extension/webpack.config.js`):**
   * Configure Webpack for Chrome extension development:
     * Multiple entry points: `popup`, `background`, `content`
     * TypeScript compilation with `ts-loader`
     * React JSX support for popup components
     * Copy plugin for manifest.json and static assets
     * Development vs production builds
     * Source maps for debugging
   * **Output Configuration:**
     * `output.path: 'extension-dist/'`
     * Separate bundles for each entry point
     * Asset optimization for extension size limits
   * **Extension-Specific Optimizations:**
     * Exclude Node.js polyfills not needed in extension context
     * Bundle splitting for popup vs background vs content scripts
     * Asset copying for icons and static files

3. **Chrome Storage Utilities (`src/extension/shared/storage.ts`):**
   * Create simple Chrome storage wrapper for essential data only:
     * `setStorageItem<T>(key: string, value: T): Promise<void>`
     * `getStorageItem<T>(key: string): Promise<T | null>`
     * `clearStorage(): Promise<void>`
   * **Simplified Storage Schema (MVP):**
     * `currentEventId?: string` - Active event context
     * `authToken?: string` - Google OAuth token
     * `basicPreferences?: {autoApprove?: boolean}` - Minimal settings
   * **Best Practice:** Use `chrome.storage.local` for simplicity, avoid over-engineering sync features

4. **Message Passing System (`src/extension/shared/messaging.ts`):**
   * Implement simple message passing for essential communication:
     * `sendMessageToBackground(message: ExtensionMessage): Promise<any>`
     * `setupMessageListener(handler: MessageHandler): void`
   * **Essential Message Types (MVP):**
     * Authentication: `AUTH_STATUS`, `LOGIN_REQUEST`, `LOGOUT_REQUEST`
     * Event management: `GET_CURRENT_EVENT`, `SET_CURRENT_EVENT`
     * Simple actions: `EXECUTE_ACTION` (generic for MVP buttons)
   * **Error Handling:** Basic error propagation, keep it simple

### Part B: Service Worker (Background Script) Implementation
**Goals:**
- Handle Google OAuth authentication flow
- Manage API communication with EventConnect backend
- Coordinate between popup and content scripts
- Implement background processing for contextual analysis

**Files & Context:**
- Background: `src/extension/background/service-worker.ts`
- API Client: `src/extension/background/api-client.ts`
- Auth Handler: `src/extension/background/google-auth.ts`
- Message Handler: `src/extension/background/message-handler.ts`

**Tasks:**
1. **Service Worker Entry Point (`src/extension/background/service-worker.ts`):**
   * Set up service worker lifecycle:
     * `chrome.runtime.onInstalled` - Extension installation/update handling
     * `chrome.runtime.onStartup` - Extension startup initialization
     * `chrome.action.onClicked` - Handle extension icon clicks (fallback)
   * **Installation Flow:**
     * Check for existing authentication on install
     * Set default user preferences
     * Initialize storage schema
     * Open onboarding web app if first install
   * **State Management:**
     * Maintain authentication state
     * Cache current event context
     * Handle token refresh automatically

2. **Google OAuth Integration (`src/extension/background/google-auth.ts`):**
   * Implement Chrome Identity API OAuth flow:
     * `authenticateUser(): Promise<GoogleAuthToken>`
     * `refreshToken(refreshToken: string): Promise<GoogleAuthToken>`
     * `isAuthenticated(): Promise<boolean>`
     * `logout(): Promise<void>`
   * **OAuth Configuration:**
     * Use `chrome.identity.launchWebAuthFlow()` for secure OAuth
     * Request comprehensive Google Workspace permissions:
       * `https://www.googleapis.com/auth/spreadsheets` - Sheets read/write
       * `https://www.googleapis.com/auth/calendar` - Calendar integration
       * `https://www.googleapis.com/auth/gmail.send` - Email sending
       * `https://www.googleapis.com/auth/drive.file` - Drive file access
   * **Token Management:**
     * Secure token storage using Chrome storage encryption
     * Automatic token refresh before expiration
     * Handle OAuth errors and re-authentication flow

3. **Backend API Client (`src/extension/background/api-client.ts`):**
   * Create API communication layer with EventConnect backend:
     * `class ApiClient` with authentication headers
     * `makeAuthenticatedRequest<T>(endpoint: string, options: RequestOptions): Promise<T>`
     * Error handling for network issues and API errors
   * **Essential API Methods (MVP):**
     * `auth.validateToken(): Promise<boolean>`
     * `events.getCurrentEvent(): Promise<Event | null>`
     * `events.setCurrentEvent(eventId: string): Promise<void>`
     * `sheets.readEventData(): Promise<any>` - Simple Google Sheets read
     * `sheets.updateEventData(data: any): Promise<void>` - Simple write
   * **Request Configuration:**
     * Base URL from environment (localhost:3000 for dev)
     * Automatic authentication header injection
     * Request/response interceptors for logging
     * Retry logic with exponential backoff

4. **Message Handler Coordination (`src/extension/background/message-handler.ts`):**
   * Central message routing for extension communication:
     * `handlePopupMessage(message: ExtensionMessage): Promise<any>`
     * `handleContentMessage(message: ExtensionMessage): Promise<any>`
     * Route messages to appropriate handlers (auth, events, actions)
   * **Message Processing:**
     * Authentication requests → Google OAuth flow
     * Event management → API calls and storage updates
     * Action execution → Backend API coordination
     * Page analysis requests → Content script coordination
   * **Error Handling:** Consistent error responses and logging

### Part C: React Popup Interface with Action Buttons
**Goals:**
- Create beautiful, button-based popup interface (no chat UI)
- Implement predefined action buttons for common event management tasks
- Show current event context and status
- Provide approval workflow for future AI-enhanced actions

**Files & Context:**
- Popup root: `src/extension/popup/popup.tsx`
- Components: `src/extension/popup/components/`
- Hooks: `src/extension/popup/hooks/`
- Styles: Extension-specific Tailwind configuration

**Tasks:**
1. **Popup React Application (`src/extension/popup/popup.tsx`):**
   * Create main popup React app:
     * Initialize React 18 with proper extension CSP compliance
     * Set up error boundaries for graceful error handling
     * Implement responsive design for extension popup constraints (400px width max)
   * **App Structure:**
     * Header with EventConnect branding and current event context
     * Authentication state handling (login prompt vs authenticated UI)
     * Main action buttons grid
     * Footer with settings and help links
   * **State Management:**
     * Use React Context or simple useState for popup-level state
     * Communication with background script via message passing
     * Real-time updates from Chrome storage changes

2. **Authentication Components (`src/extension/popup/components/auth/`):**
   * **`LoginPrompt.tsx`:**
     * Beautiful login interface with Google branding
     * "Sign in with Google" button triggering OAuth flow
     * Loading states during authentication
     * Error handling for failed authentication
   * **`AuthGuard.tsx`:**
     * Wrapper component that checks authentication status
     * Shows login prompt for unauthenticated users
     * Renders children for authenticated users
     * Handles token validation and refresh

3. **Event Context Display (`src/extension/popup/components/events/`):**
   * **`EventSelector.tsx`:**
     * Dropdown or compact selector for current event
     * Display current event name and key details
     * "No event selected" state with setup instructions
     * Quick event switching capability
   * **`EventStatusCard.tsx`:**
     * Compact status overview: budget health, upcoming deadlines, task completion
     * Visual indicators using EventConnect color scheme
     * Click to expand for more details

4. **Predefined Action Buttons (`src/extension/popup/components/actions/`):**
   * **`ActionButtonGrid.tsx`:**
     * Grid layout of primary action buttons
     * Responsive design for different popup sizes
     * Loading states for button actions
   * **Essential Action Buttons (MVP - 2-3 buttons only):**
     * **`EventStatusButton.tsx`:** "View Event Status"
       * Simple read from connected Google Sheets
       * Shows key metrics: budget status, upcoming deadlines, task completion
       * Clean, readable format with basic styling
     * **`QuickUpdateButton.tsx`:** "Quick Update"
       * Simple text input for adding notes or status updates
       * Appends to event log with timestamp
       * One-click submission to Google Sheets
     * **`NextTasksButton.tsx`:** "View Next Tasks" (Optional 3rd button)
       * Shows upcoming items from timeline worksheet
       * Simple list format with due dates
       * Basic mark-as-complete functionality
   * **Button Design Standards:**
     * Consistent styling with EventConnect brand colors
     * Clear icons and descriptive text
     * Loading states and success feedback
     * Error handling with user-friendly messages

5. **Custom Hooks for Extension Logic (`src/extension/popup/hooks/`):**
   * **`useAuth.ts`:**
     * `const { isAuthenticated, login, logout, loading, error } = useAuth()`
     * Simple authentication state management
     * Basic token validation
   * **`useEventData.ts`:**
     * `const { eventData, updateEventData, loading, error } = useEventData()`
     * Simple Google Sheets read/write operations
     * Manages current event context
   * **`useExtensionStorage.ts`:**
     * `const { getValue, setValue } = useExtensionStorage<T>(key)`
     * Basic Chrome storage integration
     * Keep it simple, avoid over-engineering

### Part D: Minimal Content Script (MVP)
**Goals:**
- Basic page detection for event-related sites
- Store simple page context for future use
- Keep it ultra-simple for MVP
- Foundation for Phase 2 contextual features

**Files & Context:**
- Content script: `src/extension/content/content-script.ts` (single file)

**Tasks:**
1. **Ultra-Simple Content Script (`src/extension/content/content-script.ts`):**
   ```typescript
   // MVP: Just detect if we're on an event-planning related site
   document.addEventListener('DOMContentLoaded', () => {
     // Basic keyword detection in hostname
     const isEventSite = window.location.hostname.includes('venue') || 
                        window.location.hostname.includes('catering') ||
                        window.location.hostname.includes('wedding') ||
                        window.location.hostname.includes('event') ||
                        window.location.hostname.includes('party');
     
     // Store basic page context for future use
     chrome.storage.local.set({
       currentPageContext: {
         url: window.location.href,
         title: document.title,
         domain: window.location.hostname,
         isEventRelated: isEventSite,
         timestamp: Date.now()
       }
     });
   });
   ```
   * **Key Principles:**
     * No complex DOM analysis
     * No performance-heavy operations
     * Just capture basic info for Phase 2
     * Minimal footprint on host pages

### Part E: Streamlined Development Workflow (MVP)
**Goals:**
- Simple build process for development
- Essential assets only
- Focus on getting MVP working quickly
- Avoid over-engineering development setup

**Files & Context:**
- Build scripts: `src/extension/package.json` scripts
- Assets: `src/extension/assets/` (essential icons only)
- Development: Basic Chrome developer mode setup

**Tasks:**
1. **Essential Development Scripts (`src/extension/package.json`):**
   * **Development Mode:**
     * `npm run dev` - Simple Webpack watch mode
     * `npm run build` - Production build
     * Basic manifest.json and asset copying
   * **Quality Checks:**
     * `npm run type-check` - TypeScript compilation
     * Integration with root workspace linting

2. **Essential Assets Only (`src/extension/assets/`):**
   * **Required Icons:**
     * `icons/icon-16.png` - Toolbar icon
     * `icons/icon-48.png` - Extension management
     * `icons/icon-128.png` - Installation
   * **Keep It Simple:**
     * Use simple, clean EventConnect branding
     * No complex graphics or animations for MVP
     * Focus on functionality over visual polish

3. **Basic Development Setup:**
   * **Chrome Developer Mode:**
     * Load unpacked extension for testing
     * Basic debugging with Chrome DevTools
     * Simple manual testing workflow
   * **No Complex Tooling:**
     * Skip hot reload complexity for MVP
     * Manual extension reload during development
     * Focus on core functionality first

---

## Simplified File Structure for MVP:

```
src/extension/
├── manifest.json                    # Manifest V3 configuration
├── background/
│   ├── service-worker.ts           # Main background logic
│   └── google-auth.ts              # Simple OAuth handling
├── popup/
│   ├── popup.tsx                   # Main React app
│   ├── components/
│   │   ├── AuthGuard.tsx           # Authentication wrapper
│   │   ├── EventStatus.tsx         # Simple status display
│   │   └── ActionButtons.tsx       # 2-3 essential buttons
│   └── hooks/
│       ├── useAuth.ts              # Authentication state
│       └── useEventData.ts         # Simple sheets integration
├── content/
│   └── content-script.ts           # Minimal page detection (20 lines)
├── shared/
│   ├── storage.ts                  # Simple storage utilities
│   └── messaging.ts                # Basic message passing
└── assets/
    └── icons/                      # Essential icons only
```

## Integration Points with EventConnect Architecture:

1. **Shared Types Package Integration:**
   - Extension uses `@eventconnect/shared-types` for essential types only
   - Simple interfaces for authentication and event data
   - Basic message passing types

2. **Backend API Coordination:**
   - Extension communicates with `src/api/` for auth and Google Sheets operations
   - Simple REST API calls, no complex orchestration
   - Preparation for Phase 2 AI integration

3. **Google Sheets Integration:**
   - Direct Google Sheets API calls for read/write operations
   - Simple data synchronization with user's event dashboards
   - Foundation for future AI-enhanced operations

4. **MVP Principles:**
   - **Simplicity First:** 2-3 action buttons, minimal complexity
   - **Clean Code:** Well-organized structure without over-engineering
   - **Future-Ready:** Foundation for Phase 2 AI enhancements
   - **User Value:** Immediate utility through basic event management actions

This simplified approach delivers the core Chrome extension-first architecture while maintaining clean, organized code and avoiding unnecessary complexity. The foundation supports future AI enhancements without over-engineering the MVP implementation.