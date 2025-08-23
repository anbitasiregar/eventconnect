// Chrome extension message types and interfaces

export interface ExtensionMessage {
  type: MessageType;
  payload: any;
  requestId?: string;
}

export enum MessageType {
  // Authentication
  AUTH_STATUS = 'auth_status',
  LOGIN_REQUEST = 'login_request',
  LOGOUT_REQUEST = 'logout_request',
  
  // Events
  GET_CURRENT_EVENT = 'get_current_event',
  SET_CURRENT_EVENT = 'set_current_event',
  CREATE_EVENT = 'create_event',
  
  // Agent Actions
  EXECUTE_AGENT_ACTION = 'execute_agent_action',
  APPROVE_ACTION = 'approve_action',
  REJECT_ACTION = 'reject_action',
  GET_PENDING_ACTIONS = 'get_pending_actions',
  
  // Page Context
  ANALYZE_PAGE = 'analyze_page',
  GET_SUGGESTIONS = 'get_suggestions',
  
  // Storage
  STORAGE_GET = 'storage_get',
  STORAGE_SET = 'storage_set',
  STORAGE_CLEAR = 'storage_clear'
}

export interface PageContext {
  url: string;
  title: string;
  domain: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface ContextualSuggestion {
  id: string;
  title: string;
  description: string;
  action: SuggestionAction;
  priority: number;
  eventId?: string;
}

export interface SuggestionAction {
  type: 'agent_task' | 'navigate' | 'external_link';
  payload: Record<string, any>;
}

export interface ExtensionStorage {
  currentEventId?: string;
  authToken?: string;
  userPreferences?: UserPreferences;
  pageAnalysisCache?: Record<string, PageContext>;
}

export interface UserPreferences {
  autoApproveActions?: boolean;
  showNotifications?: boolean;
  defaultEventType?: string;
  contextualSuggestionsEnabled?: boolean;
}
