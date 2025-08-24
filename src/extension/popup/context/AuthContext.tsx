import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
