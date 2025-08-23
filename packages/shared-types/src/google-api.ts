// Google API integration types

export interface GoogleAuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string[];
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SheetsApiResponse {
  spreadsheetId: string;
  values?: any[][];
  updatedCells?: number;
  updatedRows?: number;
}

export interface SheetsCreateRequest {
  title: string;
  worksheets: WorksheetCreateRequest[];
}

export interface WorksheetCreateRequest {
  title: string;
  headers: string[];
  data?: any[][];
}

export interface GmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
}
