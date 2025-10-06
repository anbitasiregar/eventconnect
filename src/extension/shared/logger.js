"use strict";
/**
 * Centralized logging and error handling for EventConnect Extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionError = exports.Logger = exports.LogLevel = void 0;
exports.initializeLogger = initializeLogger;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    /**
     * Set the current log level
     */
    static setLevel(level) {
        Logger.currentLevel = level;
    }
    /**
     * Log a message at the specified level
     */
    static log(level, message, ...args) {
        if (level < Logger.currentLevel) {
            return;
        }
        const timestamp = new Date().toISOString();
        const logEntry = {
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
    static debug(message, ...args) {
        Logger.log(LogLevel.DEBUG, message, ...args);
    }
    /**
     * Log info message
     */
    static info(message, ...args) {
        Logger.log(LogLevel.INFO, message, ...args);
    }
    /**
     * Log warning message
     */
    static warn(message, ...args) {
        Logger.log(LogLevel.WARN, message, ...args);
    }
    /**
     * Log error message
     */
    static error(message, error, ...args) {
        const allArgs = error ? [error, ...args] : args;
        Logger.log(LogLevel.ERROR, message, ...allArgs);
    }
    /**
     * Get recent logs
     */
    static getLogs(count = 100) {
        return Logger.logs.slice(-count);
    }
    /**
     * Clear all logs
     */
    static clearLogs() {
        Logger.logs = [];
    }
    /**
     * Export logs as JSON
     */
    static exportLogs() {
        return JSON.stringify(Logger.logs, null, 2);
    }
}
exports.Logger = Logger;
Logger.currentLevel = LogLevel.INFO;
Logger.logs = [];
Logger.MAX_LOGS = 1000;
/**
 * Custom error class for extension-specific errors
 */
class ExtensionError extends Error {
    constructor(message, code, userMessage, retryable = false) {
        super(message);
        this.code = code;
        this.userMessage = userMessage;
        this.retryable = retryable;
        this.name = 'ExtensionError';
    }
    /**
     * Convert to user-friendly message
     */
    toUserMessage() {
        return this.userMessage || this.message;
    }
    /**
     * Check if error is retryable
     */
    isRetryable() {
        return this.retryable;
    }
}
exports.ExtensionError = ExtensionError;
/**
 * Initialize logger based on environment
 */
function initializeLogger() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    Logger.setLevel(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
    Logger.info('Logger initialized', {
        environment: process.env.NODE_ENV || 'unknown'
    });
}
//# sourceMappingURL=logger.js.map