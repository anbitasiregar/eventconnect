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
exports.EventStatusButton = void 0;
const react_1 = __importStar(require("react"));
const EventContext_1 = require("../../context/EventContext");
const Button_1 = require("../ui/Button");
const Modal_1 = require("../ui/Modal");
const ErrorMessage_1 = require("../ui/ErrorMessage");
const outline_1 = require("@heroicons/react/24/outline");
const StatusModal = ({ data, onClose }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const getBudgetHealthColor = (remaining, total) => {
        const percentage = (remaining / total) * 100;
        if (percentage > 20)
            return 'text-green-600';
        if (percentage > 10)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    return (<Modal_1.Modal isOpen={true} onClose={onClose} title="Event Status" size="lg">
      <div className="space-y-6">
        {/* Event Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 text-lg">{data.eventName}</h3>
          <p className="text-blue-700">{data.eventDate}</p>
        </div>

        {/* Budget Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Budget Overview</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(data.budget.total)}
                </div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(data.budget.spent)}
                </div>
                <div className="text-sm text-gray-600">Spent</div>
              </div>
              <div>
                <div className={`text-lg font-semibold ${getBudgetHealthColor(data.budget.remaining, data.budget.total)}`}>
                  {formatCurrency(data.budget.remaining)}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Task Progress</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">
                {data.tasks.completed} of {data.tasks.total} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(data.tasks.completed / data.tasks.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        {data.tasks.upcoming.length > 0 && (<div>
            <h4 className="font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
            <div className="space-y-2">
              {data.tasks.upcoming.slice(0, 3).map((task, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{task.name}</div>
                    <div className="text-sm text-gray-600">{task.dueDate}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                    {task.priority}
                  </span>
                </div>))}
            </div>
          </div>)}

        {/* Vendor Status */}
        {data.vendors.length > 0 && (<div>
            <h4 className="font-medium text-gray-900 mb-3">Key Vendors</h4>
            <div className="space-y-2">
              {data.vendors.slice(0, 3).map((vendor, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-sm text-gray-600">{vendor.category}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${vendor.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                    vendor.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                    {vendor.status}
                  </span>
                </div>))}
            </div>
          </div>)}
      </div>
    </Modal_1.Modal>);
};
const EventStatusButton = () => {
    const [showDetails, setShowDetails] = (0, react_1.useState)(false);
    const { getEventStatus, isLoading, error, currentEvent, clearError } = (0, EventContext_1.useEventContext)();
    const [statusData, setStatusData] = (0, react_1.useState)(null);
    const handleViewStatus = async () => {
        if (!currentEvent) {
            return;
        }
        try {
            clearError();
            const data = await getEventStatus();
            setStatusData(data);
            setShowDetails(true);
        }
        catch (err) {
            // Error is handled by the hook
            console.error('Failed to get event status:', err);
        }
    };
    return (<>
      <Button_1.Button onClick={handleViewStatus} isLoading={isLoading} disabled={!currentEvent} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <outline_1.ChartBarIcon className="w-5 h-5"/>
          <span>View Event Status</span>
        </div>
        <outline_1.ChevronRightIcon className="w-4 h-4"/>
      </Button_1.Button>

      {error && (<ErrorMessage_1.ErrorMessage message={error} className="mt-2" onRetry={clearError}/>)}

      {showDetails && statusData && (<StatusModal data={statusData} onClose={() => setShowDetails(false)}/>)}
    </>);
};
exports.EventStatusButton = EventStatusButton;
//# sourceMappingURL=EventStatusButton.js.map