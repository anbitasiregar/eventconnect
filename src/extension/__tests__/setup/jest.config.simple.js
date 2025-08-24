/**
 * Simplified Jest configuration for EventConnect Chrome Extension MVP
 */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../..'],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  collectCoverageFrom: [
    '../../shared/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
