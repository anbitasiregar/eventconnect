export interface Event {
    id: string;
    name: string;
    type: EventType;
    date: Date;
    status: EventStatus;
    sheetsId: string;
    ownerId: string;
    collaborators: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum EventType {
    WEDDING = "wedding",
    CORPORATE = "corporate",
    PARTY = "party",
    CONFERENCE = "conference",
    OTHER = "other"
}
export declare enum EventStatus {
    PLANNING = "planning",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
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
//# sourceMappingURL=events.d.ts.map