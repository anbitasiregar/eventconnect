/**
 * Environment Configuration for EventConnect Extension
 */
interface ExtensionConfig {
    apiBaseUrl: string;
    googleClientId: string;
    isDevelopment: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    features: {
        enableAnalytics: boolean;
        enableDebugMode: boolean;
        enableCaching: boolean;
    };
    limits: {
        maxRetries: number;
        requestTimeout: number;
        cacheTimeout: number;
    };
}
export declare const config: ExtensionConfig;
/**
 * Validate configuration on startup
 */
export declare function validateConfig(): boolean;
/**
 * Get environment-specific settings
 */
export declare function getEnvironmentSettings(): {
    isDevelopment: boolean;
    apiBaseUrl: string;
    features: {
        enableAnalytics: boolean;
        enableDebugMode: boolean;
        enableCaching: boolean;
    };
    limits: {
        maxRetries: number;
        requestTimeout: number;
        cacheTimeout: number;
    };
};
/**
 * Update configuration at runtime (for testing)
 */
export declare function updateConfig(updates: Partial<ExtensionConfig>): void;
export {};
//# sourceMappingURL=config.d.ts.map