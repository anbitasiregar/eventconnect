"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = void 0;
const react_1 = __importDefault(require("react"));
const Footer = () => {
    const openWebApp = () => {
        chrome.tabs.create({ url: 'http://localhost:3000' });
    };
    const openSupport = () => {
        chrome.tabs.create({ url: 'mailto:support@eventconnect.app' });
    };
    return (<footer className="bg-gray-50 border-t border-gray-200 px-4 py-3 mt-auto">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <button onClick={openWebApp} className="hover:text-blue-600 transition-colors">
            Web App
          </button>
          <button onClick={openSupport} className="hover:text-blue-600 transition-colors">
            Support
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>);
};
exports.Footer = Footer;
//# sourceMappingURL=Footer.js.map