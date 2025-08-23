// Event-related types for EventConnect

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: Date;
  status: EventStatus;
  sheetsId: string; // Google Sheets ID for event dashboard
  ownerId: string; // Google user ID
  collaborators: string[]; // Google user IDs with access
  createdAt: Date;
  updatedAt: Date;
}

export enum EventType {
  WEDDING = 'wedding',
  CORPORATE = 'corporate',
  PARTY = 'party',
  CONFERENCE = 'conference',
  OTHER = 'other'
}

export enum EventStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface EventTemplate {
  type: EventType;
  name: string;
  description: string;
  sheetsStructure: SheetsStructure;
}

export interface SheetsStructure {
  worksheets: WorksheetTemplate[];
}

export interface WorksheetTemplate {
  name: string;
  headers: string[];
  defaultRows?: Record<string, any>[];
}
