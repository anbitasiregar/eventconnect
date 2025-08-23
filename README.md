# EventConnect

AI-powered event planning platform with Chrome extension and Google Sheets integration.

## Architecture

EventConnect uses a simplified, Chrome extension-first architecture:

- **Chrome Extension** (`src/extension/`) - Primary user interface with contextual awareness
- **Backend API** (`src/api/`) - Simple Node.js server handling Google APIs and AI agents  
- **Web App** (`src/web/`) - React onboarding and complex workflows
- **Shared Packages** (`packages/`) - Common types and Google Sheets templates

## Key Features

- **Chrome Extension-First**: Primary interaction through browser extension
- **Google Sheets Integration**: Event data stored in user's Google Sheets
- **AI Agent System**: Event Controller Agent (ECP) coordinates specialized agents
- **Button-Based UI**: Approval workflows instead of chat interfaces
- **Google Workspace Native**: Built on Google's ecosystem for security and familiarity

## Getting Started

```bash
# Install dependencies
npm install

# Start development environment
npm run dev

# Build all packages
npm run build
```

## Project Structure

```
eventconnect/
├── packages/
│   ├── shared-types/          # TypeScript interfaces
│   └── sheets-templates/      # Google Sheets templates
├── src/
│   ├── extension/            # Chrome extension (primary UI)
│   ├── api/                  # Node.js backend
│   └── web/                  # React web app
```

## Development

This is a monorepo using npm workspaces. Each package can be developed independently:

- `npm run dev:extension` - Chrome extension development
- `npm run dev:api` - Backend API development  
- `npm run dev:web` - Web app development
- `npm run dev` - All services concurrently