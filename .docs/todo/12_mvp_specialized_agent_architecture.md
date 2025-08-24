**Core Responsibilities:**
* Acts as the single point of contact for all user interactions
* Analyzes user requests and determines which specialized agent should handle the task
* Coordinates between specialized agents to complete complex workflows
* Presents all AI suggestions as actionable buttons requiring user approval
* Maintains context awareness of current event state and user's browsing activity

**Key Functions:**
* **Request Routing:** Receives user button clicks and determines appropriate backend agent
* **Context Management:** Combines Google Sheets event data with current webpage context
* **Response Formatting:** Transforms agent outputs into beautiful UI cards and action buttons
* **Approval Orchestration:** Manages user approval workflows for all AI-suggested actions
* **Daily Briefing Generation:** Analyzes event status to create morning priority recommendations

**Implementation Notes:**
* Single Google Gemini API integration point for cost efficiency
* Lightweight prompt engineering focused on event planning domain
* Stateless design - all context retrieved fresh from Google Sheets
* Error handling with graceful degradation when agents are unavailable

### Communications Agent - Behind the Scenes

**Core Responsibilities:**
* Handles all external communication with guests, vendors, and stakeholders
* Manages RSVP tracking and guest data collection
* Coordinates vendor follow-ups and contract communications
* Processes email templates and communication sequences

**Key Functions:**
* **Email Draft Generation:** Creates vendor follow-up emails, guest reminders, and status updates
* **RSVP Management:** Tracks guest responses through Google Forms integration
* **Vendor Coordination:** Manages payment reminders, delivery confirmations, and status requests
* **Communication Scheduling:** Suggests optimal timing for outreach based on event timeline
* **Template Customization:** Adapts communication templates to event-specific details

**Data Sources:**
* Google Sheets guest list and vendor contact information
* Gmail integration for communication history tracking
* WhatsApp Web for RSVP data collection and guest messaging
* Event timeline data for communication scheduling

### Timeline & Budget Agent - Behind the Scenes

**Core Responsibilities:**
* Monitors event timeline and milestone progress
* Tracks budget spending and vendor payment schedules
* Analyzes contract deadlines and delivery dates
* Identifies potential timeline conflicts and budget overruns

**Key Functions:**
* **Milestone Tracking:** Monitors Google Calendar events and Google Sheets timeline data
* **Budget Analysis:** Tracks expenses against planned budgets with variance alerts
* **Deadline Management:** Identifies approaching deadlines and suggests proactive actions
* **Contract Monitoring:** Tracks vendor payment schedules and deliverable dates
* **Risk Assessment:** Identifies potential issues before they become critical problems

**Data Sources:**
* Google Sheets budget and timeline tabs
* Google Calendar for milestone and deadline tracking
* Google Drive for contract and invoice document analysis
* Vendor communication history for delivery status updates

### Agent Coordination Workflow

**Simple Orchestration Process:**
1. **User Action:** User clicks a button in Chrome extension or web app
2. **ECP Processing:** Event Controller Agent analyzes the request and current context
3. **Agent Delegation:** ECP determines which specialized agent(s) should handle the task
4. **Task Execution:** Specialized agents process the request using their domain expertise
5. **Response Compilation:** ECP compiles agent outputs into user-friendly action cards
6. **User Approval:** User sees clear approve/reject options for all suggested actions
7. **Action Execution:** Upon approval, agents execute the approved actions
8. **Google Sheets Update:** All changes are reflected in the user's event dashboard

**Error Handling:**
* Graceful fallback when specialized agents are unavailable
* Clear error messages presented as informational cards
* Retry mechanisms for temporary API failures
* User notification of any limitations or issues

**Performance Optimization:**
* Agents work in parallel when possible to reduce response time
* Caching of frequently accessed Google Sheets data
* Batch processing of similar tasks to minimize API calls
* Smart prompt engineering to reduce token usage and costs