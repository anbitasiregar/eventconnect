// AI Agent types for EventConnect

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
}

export enum AgentType {
  EVENT_CONTROLLER = 'event_controller', // ECP - main coordinator
  COMMUNICATIONS = 'communications',      // Communications Agent
  TIMELINE_BUDGET = 'timeline_budget'     // Timeline & Budget Agent
}

export interface AgentTask {
  id: string;
  agentId: string;
  eventId: string;
  description: string;
  status: TaskStatus;
  requiresApproval: boolean;
  approvedAt?: Date;
  completedAt?: Date;
  context: Record<string, any>;
  result?: AgentTaskResult;
}

export enum TaskStatus {
  PENDING = 'pending',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed'
}

export interface AgentTaskResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  sheetsUpdates?: SheetsUpdate[];
}

export interface SheetsUpdate {
  sheetsId: string;
  worksheet: string;
  range: string;
  values: any[][];
}

export interface AgentAction {
  id: string;
  taskId: string;
  type: ActionType;
  description: string;
  requiresApproval: boolean;
  approved?: boolean;
  metadata: Record<string, any>;
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  UPDATE_SHEETS = 'update_sheets',
  CREATE_CALENDAR_EVENT = 'create_calendar_event',
  ANALYZE_BUDGET = 'analyze_budget',
  GENERATE_TIMELINE = 'generate_timeline',
  SEND_REMINDER = 'send_reminder'
}
