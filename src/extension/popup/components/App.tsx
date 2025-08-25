import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthGuard } from './auth/AuthGuard';
import { EventSelector } from './events/EventSelector';
import { ActionButtonGrid } from './actions/ActionButtonGrid';
import { useAuthContext } from '../context/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Button } from './ui/Button';

export const App: React.FC = () => {
  const { isLoading } = useAuthContext();
  const [showFallback, setShowFallback] = useState(false);

  // Add timeout fallback for loading states
  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        setShowFallback(true);
      }
    }, 8000); // Show fallback after 8 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Show fallback UI if loading takes too long
  if (isLoading && showFallback) {
    return (
      <div className="extension-popup bg-white flex flex-col">
        <Header />
        <main className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Taking longer than expected...
            </h3>
            <p className="text-gray-600 text-sm mb-4 max-w-sm">
              The extension is having trouble connecting. This might be due to network issues or the extension needs to be reloaded.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry Connection
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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="extension-popup bg-white flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <AuthGuard>
          <EventSelector />
          <ActionButtonGrid />
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
};
