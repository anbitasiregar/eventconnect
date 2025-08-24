/**
 * Centralized logging and error handling for EventConnect Extension
 */

export enum LogLevel {
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

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 1000;

  /**
   * Set the current log level
   */
  static setLevel(level: LogLevel): void {
    Logger.currentLevel = level;
  }

  /**
   * Log a message at the specified level
   */
  static log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < Logger.currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      args,
      error: args.find(arg => arg instanceof Error)
    };

    // Add to internal log storage
    Logger.logs.push(logEntry);
    if (Logger.logs.length > Logger.MAX_LOGS) {
      Logger.logs.shift();
    }

    // Output to console
    const levelName = LogLevel[level];
    const prefix = `[EventConnect ${levelName}] ${timestamp}:`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, ...args: any[]): void {
    Logger.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log info message
   */
  static info(message: string, ...args: any[]): void {
    Logger.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...args: any[]): void {
    Logger.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error, ...args: any[]): void {
    const allArgs = error ? [error, ...args] : args;
    Logger.log(LogLevel.ERROR, message, ...allArgs);
  }

  /**
   * Get recent logs
   */
  static getLogs(count: number = 100): LogEntry[] {
    return Logger.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    Logger.logs = [];
  }

  /**
   * Export logs as JSON
   */
  static exportLogs(): string {
    return JSON.stringify(Logger.logs, null, 2);
  }
}

/**
 * Custom error class for extension-specific errors
 */
export class ExtensionError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage?: string,
    public retryable = false
  ) {
    super(message);
    this.name = 'ExtensionError';
  }

  /**
   * Convert to user-friendly message
   */
  toUserMessage(): string {
    return this.userMessage || this.message;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }
}

/**
 * Initialize logger based on environment
 */
export function initializeLogger(): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  Logger.setLevel(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
  
  Logger.info('Logger initialized', { 
    environment: process.env.NODE_ENV || 'unknown'
  });
}
