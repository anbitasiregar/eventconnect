# Product Backlog - EventConnect v1.0

This document outlines the high-level product backlog for the EventConnect platform, organized by launch readiness priority for a 1-month MVP development timeline.

## Phase 1: Core Launch Requirements (MVP) - Week 1-4

The simplest possible solution that delivers core user value: a Chrome extension that provides action buttons for event management tasks, backed by Google Sheets integration and basic AI assistance.

### 1. Chrome Extension Foundation
* **Goal:** Create the primary user interface as a simple Chrome extension with action buttons
* **Business Value:** Enables users to access EventConnect without disrupting workflow, providing one-click event management actions
* **Key Features:**
    * Manifest V3 Chrome extension with popup interface
    * React-based UI with action buttons (no chat interface)
    * Basic content script for webpage context
    * Service worker for API communication
    * Chrome storage for user session data

### 2. Google Authentication & Permissions
* **Goal:** Implement secure authentication with comprehensive Google Workspace access
* **Business Value:** Single sign-on with access to all necessary Google services for event management
* **Key Features:**
    * Google OAuth 2.0 authentication flow
    * Read/write permissions for: Google Sheets, Google Calendar, Google Docs, Gmail, Google Drive, Gemini API, Google Meets, Google Slides
    * Token management with automatic refresh
    * Secure credential storage

### 3. Web App with Simple Onboarding
* **Goal:** Beautiful onboarding experience to connect user's existing event dashboard to the platform
* **Business Value:** Seamless setup process that links user's event data to Chrome extension functionality
* **Key Features:**
    * React app with Google SSO login
    * Simple 3-step onboarding wizard:
      - Step 1: Google authentication and permissions
      - Step 2: Google Sheets selection interface (browse and select existing event dashboard)
      - Step 3: Connection confirmation with "Install Chrome Extension" prompt
    * Event dashboard preview showing connected data
    * Basic connection status dashboard
    * Clear instructions to install/use Chrome extension
    * Beautiful UI with modern design principles

### 4. Google Sheets Integration (Read Existing Dashboard)
* **Goal:** Connect to user's existing Google Sheets event dashboard as single source of truth
* **Business Value:** Works with user's current event data without requiring migration or new setup
* **Key Features:**
    * Google Sheets API integration for read/write operations
    * Sheet detection and validation from onboarding selection
    * Basic data parsing and structure verification
    * Real-time sync with user's existing event dashboard
    * Error handling for sheet access issues

### 5. Simple Node.js Backend API
* **Goal:** Minimal API layer for authentication and Google service coordination
* **Business Value:** Secure proxy between extension and Google APIs, prepares for AI integration
* **Key Features:**
    * Express.js with 3-4 essential endpoints only
    * Google API service wrapper
    * Environment configuration
    * Basic error handling and logging
    * CORS for extension communication

### 6. Predefined Action Buttons (No AI Yet)
* **Goal:** Provide useful event management actions through simple buttons in extension popup
* **Business Value:** Immediate value through common task automation without AI complexity
* **Key Features:**
    * "Check budget status" - reads current spending from sheets
    * "View upcoming deadlines" - shows next 5 deadlines from timeline
    * "Get vendor contact info" - displays vendor details from sheets
    * "Update task status" - mark tasks as complete with one click
    * "Add quick note" - append notes to event log
    * All actions update Google Sheets directly

## Phase 2: AI-Enhanced Action Buttons - Week 5-6

Add intelligence to the existing button framework without changing the core user experience.

### 7. Google Gemini Integration
* **Goal:** Add AI backend to make action buttons contextually intelligent
* **Business Value:** Transforms static buttons into smart, context-aware actions
* **Key Features:**
    * Google Gemini API integration
    * Context building from current Google Sheets data
    * Simple prompt engineering for event planning tasks
    * Token usage tracking

### 8. Event Controller Agent (ECP) - Single Agent
* **Goal:** One AI agent that handles all event management tasks behind the action buttons
* **Business Value:** Intelligent task execution while maintaining simple user interface
* **Key Features:**
    * Single agent handles: communications, timeline management, budget tracking
    * Context awareness from Google Sheets event data
    * Generates smart suggestions for existing action buttons
    * Approval workflow - all actions require user confirmation
    * Updates Google Sheets after user approval

### 9. AI-Enhanced Action Buttons
* **Goal:** Upgrade existing buttons with AI-generated suggestions and actions
* **Business Value:** Same familiar interface but with intelligent, contextual recommendations
* **Key Features:**
    * "Smart deadline alerts" - AI identifies urgent tasks
    * "Suggested vendor follow-ups" - AI drafts emails for approval
    * "Budget variance alerts" - AI flags potential overspending
    * "Next action recommendations" - AI suggests priority tasks
    * All maintain approve/reject workflow from Phase 1

## Phase 3: Advanced Features - Week 7+ (Post-MVP)

### 10. Daily Briefings
* **Goal:** Automated morning reports with actionable insights
* **Business Value:** Proactive event management without user effort
* **Key Features:**
    * Daily email/extension notification with event status
    * Priority action recommendations
    * Deadline and budget alerts
    * One-click access to recommended actions

### 11. Enhanced Chrome Extension Features
* **Goal:** Contextual capabilities based on current webpage
* **Business Value:** Seamless integration with user's research workflow
* **Key Features:**
    * Contextual vendor capture from websites
    * One-click addition of ideas to event sheets
    * Smart form pre-filling for event-related sites
    * Cross-tab event data synchronization

### 12. Specialized Agent Architecture (Future)
* **Goal:** Split ECP into specialized agents for complex event management
* **Business Value:** Deeper expertise and more sophisticated task handling
* **Key Features:**
    * Communications Agent for stakeholder coordination
    * Timeline & Budget Agent for project management
    * Agent coordination system
    * Advanced workflow automation

## Development Priorities for 1-Month MVP

**Week 1:** Chrome Extension Foundation + Google Authentication
**Week 2:** Web App with Simple Onboarding + Google Sheets Integration  
**Week 3:** Simple Backend API + Predefined Action Buttons
**Week 4:** Testing, Polish, and Basic Analytics

**Post-MVP (Week 5-6):** Add Gemini integration and ECP to make buttons intelligent

This simplified approach delivers immediate value through useful action buttons while building the foundation for AI enhancement in Phase 2.