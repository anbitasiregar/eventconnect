/**
 * Google Sheets Service for EventConnect Extension
 * Direct integration with Google Sheets API v4
 */
interface SheetColumn {
    name: string;
    description: string;
}
interface SheetTab {
    headerRow: number;
    columns: SheetColumn[];
}
interface SheetStructure {
    tabs: Record<string, SheetTab>;
    sheetTitle?: string;
    totalTabs?: number;
}
interface EventData {
    eventName: string;
    eventDate: string;
    budget: {
        total: number;
        spent: number;
        remaining: number;
    };
    tasks: {
        completed: number;
        total: number;
        upcoming: TaskItem[];
    };
    vendors: VendorContact[];
    timeline: TimelineItem[];
}
interface TaskItem {
    name: string;
    dueDate: string;
    assignedTo: string;
    priority: 'high' | 'medium' | 'low';
}
interface VendorContact {
    name: string;
    category: string;
    contact: string;
    email: string;
    phone: string;
    status: string;
}
interface TimelineItem {
    task: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
}
export declare class GoogleSheetsService {
    private getAuthToken;
    private static readonly API_BASE_URL;
    private static readonly MAX_RETRIES;
    private static readonly RETRY_DELAY;
    constructor(getAuthToken: () => Promise<string | null>);
    /**
     * Read complete event data from Google Sheet
     */
    readEventSheet(sheetId: string): Promise<EventData>;
    /**
     * Update event data in Google Sheet
     */
    updateEventData(sheetId: string, updates: Partial<EventData>): Promise<void>;
    /**
     * Append entry to event log
     */
    appendToEventLog(sheetId: string, entry: string): Promise<void>;
    /**
     * Validate sheet structure by reading README tab
     */
    validateSheetStructure(sheetId: string): Promise<{
        isValid: boolean;
        structure?: SheetStructure;
        error?: string;
    }>;
    /**
     * Get sheet name
     */
    getSheetName(sheetId: string): Promise<{
        name: string;
    } | null>;
    /**
     * Read data from specific range in sheet
     */
    private readRange;
    /**
     * Update data in specific range
     */
    private updateRange;
    /**
     * Append data to sheet
     */
    private appendToSheet;
    /**
     * Get sheet metadata
     */
    private getSheetMetadata;
    /**
     * Parse sheet data flexibly based on README structure
     */
    private parseFlexibleEventData;
    /**
     * Parse priority from string
     */
    private parsePriority;
    /**
     * Prepare overview updates for sheet
     */
    private prepareOverviewUpdates;
    /**
     * Prepare budget updates for sheet
     */
    private prepareBudgetUpdates;
    /**
     * Prepare vendor updates for sheet
     */
    private prepareVendorUpdates;
    /**
     * Prepare timeline updates for sheet
     */
    private prepareTimelineUpdates;
    /**
     * Parse string to number safely
     */
    private parseNumber;
    /**
     * Parse README tab content to extract sheet structure
     */
    private parseReadmeStructure;
    /**
     * Get stored sheet structure for a specific sheet
     */
    getSheetStructure(sheetId: string): Promise<SheetStructure | null>;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
}
export {};
//# sourceMappingURL=sheets-service.d.ts.map