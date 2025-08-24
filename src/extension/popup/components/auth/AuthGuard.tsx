import React from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LoginPrompt } from './LoginPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <LoginPrompt />;
  }
  
  return <>{children}</>;
};
