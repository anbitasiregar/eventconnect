import React from 'react';
import { Button } from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EventConnect popup error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="extension-popup bg-white">
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 text-sm mb-4 max-w-sm">
              The EventConnect extension encountered an unexpected error. Please try refreshing or contact support if the problem persists.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={() => chrome.runtime.reload()}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Reload Extension
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left w-full">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
