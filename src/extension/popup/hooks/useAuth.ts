import { useState, useEffect, useCallback } from 'react';
import { sendMessageToBackground } from '../../shared/messaging';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userInfo: UserInfo | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    userInfo: null
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'AUTH_STATUS'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: response.authenticated,
        isLoading: false
      }));

      // If authenticated, get user info
      if (response.authenticated) {
        try {
          const userResponse = await sendMessageToBackground({
            type: 'GET_USER_INFO'
          });
          
          if (!userResponse.error) {
            setState(prev => ({
              ...prev,
              userInfo: userResponse.userInfo
            }));
          }
        } catch (userError) {
          // Non-critical error, user is still authenticated
          console.warn('Failed to fetch user info:', userError);
        }
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        isAuthenticated: false
      }));
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'AUTH_LOGIN'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.success) {
        // Refresh auth status after successful login
        await checkAuthStatus();
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  }, [checkAuthStatus]);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'AUTH_LOGOUT'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userInfo: null
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    ...state,
    login,
    logout,
    refreshAuth,
    clearError
  };
};
