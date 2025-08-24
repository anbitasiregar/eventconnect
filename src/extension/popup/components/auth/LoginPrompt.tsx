import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const LoginPrompt: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuthContext();
  
  return (
    <div className="flex flex-col items-center justify-center h-96 p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Welcome to EventConnect
        </h2>
        <p className="text-gray-600 text-sm max-w-sm">
          Sign in with your Google account to access your event planning dashboard and manage your events.
        </p>
      </div>
      
      <Button
        onClick={login}
        isLoading={isLoading}
        className="flex items-center gap-3 px-6 py-3"
        disabled={isLoading}
      >
        <GoogleIcon />
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
      
      {error && (
        <ErrorMessage 
          message={error} 
          className="mt-4 text-center max-w-sm"
          onRetry={clearError}
        />
      )}
      
      <div className="mt-6 text-xs text-gray-500 text-center max-w-sm">
        <p>
          By signing in, you agree to connect your Google Sheets and Calendar for event management.
        </p>
      </div>
    </div>
  );
};
