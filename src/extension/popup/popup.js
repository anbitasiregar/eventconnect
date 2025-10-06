"use strict";
/**
 * EventConnect Extension Popup
 * Main React application entry point with full Part C implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const ErrorBoundary_1 = require("./components/ErrorBoundary");
const AuthContext_1 = require("./context/AuthContext");
const EventContext_1 = require("./context/EventContext");
const App_1 = require("./components/App");
require("./styles/popup.css");
// Initialize React app with proper error handling and context providers
const container = document.getElementById('root');
if (container) {
    const root = (0, client_1.createRoot)(container);
    root.render(<ErrorBoundary_1.ErrorBoundary>
      <AuthContext_1.AuthProvider>
        <EventContext_1.EventProvider>
          <App_1.App />
        </EventContext_1.EventProvider>
      </AuthContext_1.AuthProvider>
    </ErrorBoundary_1.ErrorBoundary>);
}
else {
    console.error('EventConnect: Root container not found');
}
//# sourceMappingURL=popup.js.map