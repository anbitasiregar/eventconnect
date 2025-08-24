/**
 * EventConnect Extension Popup
 * Main React application entry point
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EventConnect popup error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <p>Please refresh the extension or contact support.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main popup component
const PopupApp: React.FC = () => {
  return (
    <div style={{
      width: '400px',
      minHeight: '300px',
      padding: '20px',
      backgroundColor: '#ffffff'
    }}>
      <header style={{
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '16px',
        marginBottom: '20px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#333'
        }}>
          EventConnect
        </h1>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          color: '#666'
        }}>
          AI Event Planning Assistant
        </p>
      </header>

      <main>
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#666'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🎉
          </div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 500,
            margin: '0 0 8px 0'
          }}>
            Extension Foundation Ready
          </h2>
          <p style={{
            fontSize: '14px',
            margin: '0 0 20px 0',
            lineHeight: 1.4
          }}>
            Part A completed successfully. Ready for service worker implementation and action buttons.
          </p>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'left'
          }}>
            <strong>Next Steps:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Google OAuth integration</li>
              <li>Action buttons implementation</li>
              <li>Google Sheets connection</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <PopupApp />
    </ErrorBoundary>
  );
} else {
  console.error('Root container not found');
}
