"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importStar(require("react"));
const Header_1 = require("./Header");
const Footer_1 = require("./Footer");
const AuthGuard_1 = require("./auth/AuthGuard");
const EventSelector_1 = require("./events/EventSelector");
const ActionButtonGrid_1 = require("./actions/ActionButtonGrid");
const AuthContext_1 = require("../context/AuthContext");
const LoadingSpinner_1 = require("./ui/LoadingSpinner");
const Button_1 = require("./ui/Button");
const App = () => {
    const { isLoading } = (0, AuthContext_1.useAuthContext)();
    const [showFallback, setShowFallback] = (0, react_1.useState)(false);
    // Add timeout fallback for loading states
    (0, react_1.useEffect)(() => {
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
        return (<div className="extension-popup bg-white flex flex-col">
        <Header_1.Header />
        <main className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner_1.LoadingSpinner size="lg" className="mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Taking longer than expected...
            </h3>
            <p className="text-gray-600 text-sm mb-4 max-w-sm">
              The extension is having trouble connecting. This might be due to network issues or the extension needs to be reloaded.
            </p>
            <div className="space-y-2">
              <Button_1.Button onClick={() => window.location.reload()} className="w-full">
                Retry Connection
              </Button_1.Button>
              <Button_1.Button onClick={() => chrome.runtime.reload()} variant="secondary" size="sm" className="w-full">
                Reload Extension
              </Button_1.Button>
            </div>
          </div>
        </main>
        <Footer_1.Footer />
      </div>);
    }
    return (<div className="extension-popup bg-white flex flex-col">
      <Header_1.Header />
      <main className="flex-1 p-4">
        <AuthGuard_1.AuthGuard>
          <EventSelector_1.EventSelector />
          <ActionButtonGrid_1.ActionButtonGrid />
        </AuthGuard_1.AuthGuard>
      </main>
      <Footer_1.Footer />
    </div>);
};
exports.App = App;
//# sourceMappingURL=App.js.map