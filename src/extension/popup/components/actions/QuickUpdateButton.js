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
exports.QuickUpdateButton = void 0;
const react_1 = __importStar(require("react"));
const EventContext_1 = require("../../context/EventContext");
const Button_1 = require("../ui/Button");
const ErrorMessage_1 = require("../ui/ErrorMessage");
const outline_1 = require("@heroicons/react/24/outline");
const QuickUpdateButton = () => {
    const [showInput, setShowInput] = (0, react_1.useState)(false);
    const [updateText, setUpdateText] = (0, react_1.useState)('');
    const [showSuccess, setShowSuccess] = (0, react_1.useState)(false);
    const { addEventLog, isLoading, error, currentEvent, clearError } = (0, EventContext_1.useEventContext)();
    const handleQuickUpdate = async () => {
        if (!updateText.trim() || !currentEvent)
            return;
        try {
            clearError();
            await addEventLog(updateText.trim());
            setUpdateText('');
            setShowInput(false);
            setShowSuccess(true);
            // Hide success message after 3 seconds
            setTimeout(() => setShowSuccess(false), 3000);
        }
        catch (err) {
            // Error is handled by the hook
            console.error('Failed to add update:', err);
        }
    };
    const handleCancel = () => {
        setShowInput(false);
        setUpdateText('');
        clearError();
    };
    return (<>
      <Button_1.Button onClick={() => setShowInput(true)} disabled={!currentEvent} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <outline_1.PencilIcon className="w-5 h-5"/>
          <span>Quick Update</span>
        </div>
        <outline_1.PlusIcon className="w-4 h-4"/>
      </Button_1.Button>

      {showSuccess && (<div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
              </svg>
            </div>
            <p className="text-sm text-green-800">Update added successfully!</p>
          </div>
        </div>)}

      {error && (<ErrorMessage_1.ErrorMessage message={error} className="mt-2" onRetry={clearError}/>)}

      {showInput && (<div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <textarea value={updateText} onChange={(e) => setUpdateText(e.target.value)} placeholder="Add a quick note or update..." className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" rows={3} maxLength={500} autoFocus/>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {updateText.length}/500 characters
            </span>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded" disabled={isLoading}>
                Cancel
              </button>
              <Button_1.Button onClick={handleQuickUpdate} disabled={!updateText.trim() || isLoading} isLoading={isLoading} size="sm" className="bg-green-600 hover:bg-green-700">
                {isLoading ? 'Adding...' : 'Add Update'}
              </Button_1.Button>
            </div>
          </div>
        </div>)}
    </>);
};
exports.QuickUpdateButton = QuickUpdateButton;
//# sourceMappingURL=QuickUpdateButton.js.map