"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const react_1 = __importDefault(require("react"));
const AuthContext_1 = require("../../context/AuthContext");
const LoadingSpinner_1 = require("../ui/LoadingSpinner");
const LoginPrompt_1 = require("./LoginPrompt");
const AuthGuard = ({ children, fallback }) => {
    const { isAuthenticated, isLoading } = (0, AuthContext_1.useAuthContext)();
    if (isLoading) {
        return (<div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner_1.LoadingSpinner size="lg" className="mx-auto mb-4"/>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        return fallback ? <>{fallback}</> : <LoginPrompt_1.LoginPrompt />;
    }
    return <>{children}</>;
};
exports.AuthGuard = AuthGuard;
//# sourceMappingURL=AuthGuard.js.map