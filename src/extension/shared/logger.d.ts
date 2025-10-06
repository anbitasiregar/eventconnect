/**
 * Centralized logging and error handling for EventConnect Extension
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    args: any[];
    error?: Error;
}
export declare class Logger {
    private static currentLevel;
    private static logs;
    private static readonly MAX_LOGS;
    /**
     * Set the current log level
     */
    static setLevel(level: LogLevel): void;
    /**
     * Log a message at the specified level
     */
    static log(level: LogLevel, message: string, ...args: any[]): void;
    /**
     * Log debug message
     */
    static debug(message: string, ...args: any[]): void;
    /**
     * Log info message
     */
    static info(message: string, ...args: any[]): void;
    /**
     * Log warning message
     */
    static warn(message: string, ...args: any[]): void;
    /**
     * Log error message
     */
    static error(message: string, error?: Error, ...args: any[]): void;
    /**
     * Get recent logs
     */
    static getLogs(count?: number): LogEntry[];
    /**
     * Clear all logs
     */
    static clearLogs(): void;
    /**
     * Export logs as JSON
     */
    static exportLogs(): string;
}
/**
 * Custom error class for extension-specific errors
 */
export declare class ExtensionError extends Error {
    code: string;
    userMessage?: string | undefined;
    retryable: boolean;
    constructor(message: string, code: string, userMessage?: string | undefined, retryable?: boolean);
    /**
     * Convert to user-friendly message
     */
    toUserMessage(): string;
    /**
     * Check if error is retryable
     */
    isRetryable(): boolean;
}
/**
 * Initialize logger based on environment
 */
export declare function initializeLogger(): void;
export {};
//# sourceMappingURL=logger.d.ts.map