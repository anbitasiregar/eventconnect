/**
 * Environment Configuration for EventConnect Extension
 */

import { Logger } from '../shared/logger';

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

/**
 * Get configuration based on environment
 */
function createConfig(): ExtensionConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    apiBaseUrl: isDevelopment 
      ? 'http://localhost:3000' 
      : 'https://api.eventconnect.app',
    
    googleClientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here',
    
    isDevelopment,
    
    logLevel: isDevelopment ? 'debug' : 'info',
    
    features: {
      enableAnalytics: !isDevelopment,
      enableDebugMode: isDevelopment,
      enableCaching: true
    },
    
    limits: {
      maxRetries: 3,
      requestTimeout: isDevelopment ? 10000 : 5000, // 10s dev, 5s prod
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    }
  };
}

export const config: ExtensionConfig = createConfig();

/**
 * Validate configuration on startup
 */
export function validateConfig(): boolean {
  const errors: string[] = [];

  if (!config.apiBaseUrl) {
    errors.push('API base URL is not configured');
  }

  if (!config.googleClientId || config.googleClientId === 'your_google_client_id_here') {
    errors.push('Google Client ID is not configured');
  }

  if (errors.length > 0) {
    Logger.error('Configuration validation failed:', new Error(errors.join(', ')));
    return false;
  }

  Logger.info('Configuration validated successfully', {
    apiBaseUrl: config.apiBaseUrl,
    isDevelopment: config.isDevelopment,
    features: config.features
  });

  return true;
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentSettings() {
  return {
    isDevelopment: config.isDevelopment,
    apiBaseUrl: config.apiBaseUrl,
    features: config.features,
    limits: config.limits
  };
}

/**
 * Update configuration at runtime (for testing)
 */
export function updateConfig(updates: Partial<ExtensionConfig>): void {
  Object.assign(config, updates);
  Logger.info('Configuration updated', updates);
}
