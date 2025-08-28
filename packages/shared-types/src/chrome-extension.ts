// Chrome extension message types and interfaces

export interface ExtensionMessage {
  type: MessageType;
  payload: any;
  requestId?: string;
}

export enum MessageType {
  // Authentication messages
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_STATUS = 'auth_status',
  AUTH_REFRESH = 'auth_refresh',
  
  // Event management
  GET_CURRENT_EVENT = 'get_current_event',
  SET_CURRENT_EVENT = 'set_current_event',
  VALIDATE_SHEET = 'validate_sheet',
  GET_SHEET_INFO = 'get_sheet_info',
  
  // Sheet operations
  READ_EVENT_DATA = 'read_event_data',
  UPDATE_EVENT_DATA = 'update_event_data',
  APPEND_LOG = 'append_log',
  
  // Action execution
  EXECUTE_ACTION = 'execute_action',
  GET_ACTION_SUGGESTIONS = 'get_action_suggestions',
  
  // Legacy support
  LOGIN_REQUEST = 'login_request',
  LOGOUT_REQUEST = 'logout_request',
  
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
