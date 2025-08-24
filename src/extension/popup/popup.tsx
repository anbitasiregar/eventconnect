/**
 * EventConnect Extension Popup
 * Main React application entry point with full Part C implementation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { App } from './components/App';
import './styles/popup.css';

// Initialize React app with proper error handling and context providers
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <AuthProvider>
        <EventProvider>
          <App />
        </EventProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
} else {
  console.error('EventConnect: Root container not found');
}
