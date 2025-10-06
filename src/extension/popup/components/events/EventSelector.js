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
exports.EventSelector = void 0;
const react_1 = __importStar(require("react"));
const EventContext_1 = require("../../context/EventContext");
const Button_1 = require("../ui/Button");
const outline_1 = require("@heroicons/react/24/outline");
const EventSetup_1 = require("./EventSetup");
const EventSelector = () => {
    const { currentEvent, setCurrentEvent } = (0, EventContext_1.useEventContext)();
    const [showEventSetup, setShowEventSetup] = (0, react_1.useState)(false);
    const handleEventConnected = (eventId, eventName) => {
        // Update the current event in context
        setCurrentEvent({
            id: eventId,
            name: eventName,
            sheetsId: eventId,
            date: new Date().toLocaleDateString(),
            status: 'in_progress'
        });
        setShowEventSetup(false);
    };
    return (<>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Event
        </label>
        
        {currentEvent ? (<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <outline_1.CalendarIcon className="w-5 h-5 text-blue-600"/>
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">{currentEvent.name}</h3>
                  <p className="text-sm text-blue-700 mb-1">{currentEvent.date}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                currentEvent.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'}`}>
                      {currentEvent.status === 'in_progress' ? 'In Progress' :
                currentEvent.status ? currentEvent.status.charAt(0).toUpperCase() + currentEvent.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setCurrentEvent(null)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Change
              </button>
            </div>
          </div>) : (<div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <outline_1.CalendarIcon className="w-6 h-6 text-gray-400"/>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              No event selected. Connect your event dashboard to get started.
            </p>
            {/* ONLY THIS BUTTON CHANGED */}
            <Button_1.Button onClick={() => setShowEventSetup(true)} variant="secondary" size="sm" className="inline-flex items-center gap-2">
              <outline_1.LinkIcon className="w-4 h-4"/>
              Connect Google Sheets
            </Button_1.Button>
          </div>)}
      </div>

      {/* Modal for event setup */}
      {showEventSetup && (<EventSetup_1.EventSetup onEventConnected={handleEventConnected} onCancel={() => setShowEventSetup(false)}/>)}
    </>);
};
exports.EventSelector = EventSelector;
//# sourceMappingURL=EventSelector.js.map