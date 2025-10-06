import React from 'react';
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
export declare const useAuthContext: () => AuthContextType;
export declare const AuthProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=AuthContext.d.ts.map