"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
const react_1 = require("react");
const messaging_1 = require("../../shared/messaging");
const useAuth = () => {
    const [state, setState] = (0, react_1.useState)({
        isAuthenticated: false,
        isLoading: true,
        error: null,
        userInfo: null
    });
    const checkAuthStatus = (0, react_1.useCallback)(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Authentication check timed out')), 10000);
            });
            const authPromise = (0, messaging_1.sendMessageToBackground)({
                type: 'AUTH_STATUS'
            });
            const response = await Promise.race([authPromise, timeoutPromise]);
            if (response.error) {
                throw new Error(response.error);
            }
            setState(prev => ({
                ...prev,
                isAuthenticated: response.authenticated,
                isLoading: false
            }));
            // If authenticated, get user info (with timeout)
            if (response.authenticated) {
                try {
                    const userPromise = (0, messaging_1.sendMessageToBackground)({
                        type: 'GET_USER_INFO'
                    });
                    const userTimeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('User info timeout')), 5000);
                    });
                    const userResponse = await Promise.race([userPromise, userTimeoutPromise]);
                    if (!userResponse.error) {
                        setState(prev => ({
                            ...prev,
                            userInfo: userResponse.userInfo
                        }));
                    }
                }
                catch (userError) {
                    // Non-critical error, user is still authenticated
                    console.warn('Failed to fetch user info:', userError);
                }
            }
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication check failed',
                isAuthenticated: false
            }));
        }
    }, []);
    const login = (0, react_1.useCallback)(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
                type: 'AUTH_LOGIN'
            });
            if (response.error) {
                throw new Error(response.error);
            }
            if (response.success) {
                // Refresh auth status after successful login
                await checkAuthStatus();
            }
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed'
            }));
        }
    }, [checkAuthStatus]);
    const logout = (0, react_1.useCallback)(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Logout failed'
            }));
        }
    }, []);
    const refreshAuth = (0, react_1.useCallback)(async () => {
        await checkAuthStatus();
    }, [checkAuthStatus]);
    const clearError = (0, react_1.useCallback)(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);
    // Check auth status on mount
    (0, react_1.useEffect)(() => {
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
exports.useAuth = useAuth;
//# sourceMappingURL=useAuth.js.map