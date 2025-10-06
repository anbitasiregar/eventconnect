interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}
export declare const useAuth: () => {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    clearError: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    userInfo: UserInfo | null;
};
export {};
//# sourceMappingURL=useAuth.d.ts.map