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
exports.NextTasksButton = void 0;
const react_1 = __importStar(require("react"));
const EventContext_1 = require("../../context/EventContext");
const Button_1 = require("../ui/Button");
const Modal_1 = require("../ui/Modal");
const ErrorMessage_1 = require("../ui/ErrorMessage");
const outline_1 = require("@heroicons/react/24/outline");
const TasksModal = ({ tasks, onTaskComplete, onClose, isLoading }) => {
    const [completingTask, setCompletingTask] = (0, react_1.useState)(null);
    const handleTaskComplete = async (taskId) => {
        setCompletingTask(taskId);
        try {
            await onTaskComplete(taskId);
            // Task completion handled by parent
        }
        catch (error) {
            console.error('Failed to complete task:', error);
        }
        finally {
            setCompletingTask(null);
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        }
        catch {
            return dateString;
        }
    };
    const isOverdue = (dateString) => {
        try {
            const taskDate = new Date(dateString);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return taskDate < today;
        }
        catch {
            return false;
        }
    };
    const sortedTasks = [...tasks].sort((a, b) => {
        // Sort by priority first (high -> medium -> low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0)
            return priorityDiff;
        // Then by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    return (<Modal_1.Modal isOpen={true} onClose={onClose} title="Upcoming Tasks" size="lg">
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (<div className="text-center py-8">
            <outline_1.CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3"/>
            <p className="text-gray-600">All tasks completed! 🎉</p>
          </div>) : (sortedTasks.map((task) => (<div key={task.id} className={`p-4 rounded-lg border ${isOverdue(task.dueDate) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {isOverdue(task.dueDate) && (<span className="text-red-600 font-medium">Overdue</span>)}
                        <span>Assigned to: {task.assignedTo}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <Button_1.Button onClick={() => handleTaskComplete(task.id)} disabled={completingTask === task.id || isLoading} isLoading={completingTask === task.id} size="sm" variant="secondary" className="ml-3 flex-shrink-0">
                  <outline_1.CheckCircleIcon className="w-4 h-4"/>
                </Button_1.Button>
              </div>
            </div>)))}
      </div>
    </Modal_1.Modal>);
};
const NextTasksButton = () => {
    const [showTasks, setShowTasks] = (0, react_1.useState)(false);
    const { getUpcomingTasks, markTaskComplete, isLoading, error, currentEvent, clearError } = (0, EventContext_1.useEventContext)();
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const handleViewTasks = async () => {
        if (!currentEvent)
            return;
        try {
            clearError();
            const upcomingTasks = await getUpcomingTasks();
            setTasks(upcomingTasks);
            setShowTasks(true);
        }
        catch (err) {
            // Error is handled by the hook
            console.error('Failed to get upcoming tasks:', err);
        }
    };
    const handleTaskComplete = async (taskId) => {
        try {
            await markTaskComplete(taskId);
            // Remove completed task from local state
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        }
        catch (err) {
            console.error('Failed to mark task complete:', err);
            throw err; // Re-throw to handle in TasksModal
        }
    };
    return (<>
      <Button_1.Button onClick={handleViewTasks} isLoading={isLoading} disabled={!currentEvent} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between">
        <div className="flex items-center gap-3">
          <outline_1.ClockIcon className="w-5 h-5"/>
          <span>View Next Tasks</span>
        </div>
        <outline_1.ChevronRightIcon className="w-4 h-4"/>
      </Button_1.Button>

      {error && (<ErrorMessage_1.ErrorMessage message={error} className="mt-2" onRetry={clearError}/>)}

      {showTasks && (<TasksModal tasks={tasks} onTaskComplete={handleTaskComplete} onClose={() => setShowTasks(false)} isLoading={isLoading}/>)}
    </>);
};
exports.NextTasksButton = NextTasksButton;
//# sourceMappingURL=NextTasksButton.js.map