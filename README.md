# EventConnect

## Overview
Chrome extension-first event planning platform with Google Sheets integration.

## Development Setup

### Prerequisites
- Node.js 18+
- Chrome browser
- Google Cloud Console project with Sheets/Calendar/Gmail APIs enabled

### Installation
```bash
cd src/extension
npm install
npm run build:dev
```

### Loading in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select `src/extension/extension-dist/`

### Development Workflow
```bash
npm run dev          # Watch mode for development
npm run build        # Production build
npm run test:all     # Run all tests
npm run lint         # Code quality checks
```

## Architecture

### Components
- **Background Script:** Google OAuth, Sheets API, message routing
- **Popup Interface:** React app with action buttons
- **Content Script:** Event site detection and context awareness

### Data Flow
1. User authenticates via Google OAuth
2. Extension connects to user's event Google Sheets
3. Action buttons perform read/write operations on sheets
4. Context script detects event-related websites

## Testing
- Unit tests: Individual components and utilities
- Integration tests: API integrations and component communication  
- E2E tests: Complete user workflows

## Deployment
```bash
npm run package  # Creates distributable .zip file
```