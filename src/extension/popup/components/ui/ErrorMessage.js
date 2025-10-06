"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = void 0;
const react_1 = __importDefault(require("react"));
const outline_1 = require("@heroicons/react/24/outline");
const ErrorMessage = ({ message, onRetry, className = '' }) => {
    return (<div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <outline_1.ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {onRetry && (<button onClick={onRetry} className="text-sm text-red-600 hover:text-red-800 font-medium mt-1 underline">
              Try again
            </button>)}
        </div>
      </div>
    </div>);
};
exports.ErrorMessage = ErrorMessage;
//# sourceMappingURL=ErrorMessage.js.map