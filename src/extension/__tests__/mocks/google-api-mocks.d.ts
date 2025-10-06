/**
 * Google API Mocks for EventConnect Extension Testing
 */
export declare const mockGoogleSheetsAPI: {
    spreadsheets: {
        values: {
            get: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
            append: jest.Mock<any, any, any>;
        };
        get: jest.Mock<any, any, any>;
    };
};
export declare const mockGoogleAuthAPI: {
    launchWebAuthFlow: jest.Mock<any, any, any>;
    getAuthToken: jest.Mock<any, any, any>;
    getRedirectURL: jest.Mock<string, [], any>;
};
export declare const mockEventData: {
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
        upcoming: ({
            name: string;
            dueDate: string;
            assignedTo: string;
            priority: "high";
        } | {
            name: string;
            dueDate: string;
            assignedTo: string;
            priority: "medium";
        })[];
    };
    vendors: {
        name: string;
        category: string;
        contact: string;
        email: string;
        phone: string;
        status: string;
    }[];
    timeline: {
        task: string;
        dueDate: string;
        status: "completed";
        assignedTo: string;
    }[];
};
export declare const mockSheetData: string[][][];
export declare const mockGoogleAuthToken: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    expires_at: number;
};
export declare function mockChromeIdentity(): void;
export declare function mockSuccessfulOAuth(): void;
export declare function mockFailedOAuth(error?: string): void;
export declare function mockSuccessfulSheetsAPI(): void;
export declare function mockFailedSheetsAPI(error?: string): void;
export declare function resetAllMocks(): void;
//# sourceMappingURL=google-api-mocks.d.ts.map