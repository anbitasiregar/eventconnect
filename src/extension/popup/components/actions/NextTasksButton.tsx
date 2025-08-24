import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ClockIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TaskItem {
  id: string;
  name: string;
  dueDate: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

interface TasksModalProps {
  tasks: TaskItem[];
  onTaskComplete: (taskId: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const TasksModal: React.FC<TasksModalProps> = ({ tasks, onTaskComplete, onClose, isLoading }) => {
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  const handleTaskComplete = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      await onTaskComplete(taskId);
      // Task completion handled by parent
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dateString: string) => {
    try {
      const taskDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return taskDate < today;
    } catch {
      return false;
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by priority first (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="Upcoming Tasks" size="lg">
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">All tasks completed! 🎉</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border ${
                isOverdue(task.dueDate) ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{task.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {isOverdue(task.dueDate) && (
                          <span className="text-red-600 font-medium">Overdue</span>
                        )}
                        <span>Assigned to: {task.assignedTo}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleTaskComplete(task.id)}
                  disabled={completingTask === task.id || isLoading}
                  isLoading={completingTask === task.id}
                  size="sm"
                  variant="secondary"
                  className="ml-3 flex-shrink-0"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export const NextTasksButton: React.FC = () => {
  const [showTasks, setShowTasks] = useState(false);
  const { getUpcomingTasks, markTaskComplete, isLoading, error, currentEvent, clearError } = useEventContext();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const handleViewTasks = async () => {
    if (!currentEvent) return;

    try {
      clearError();
      const upcomingTasks = await getUpcomingTasks();
      setTasks(upcomingTasks);
      setShowTasks(true);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to get upcoming tasks:', err);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await markTaskComplete(taskId);
      // Remove completed task from local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Failed to mark task complete:', err);
      throw err; // Re-throw to handle in TasksModal
    }
  };

  return (
    <>
      <Button
        onClick={handleViewTasks}
        isLoading={isLoading}
        disabled={!currentEvent}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5" />
          <span>View Next Tasks</span>
        </div>
        <ChevronRightIcon className="w-4 h-4" />
      </Button>

      {error && (
        <ErrorMessage 
          message={error} 
          className="mt-2"
          onRetry={clearError}
        />
      )}

      {showTasks && (
        <TasksModal
          tasks={tasks}
          onTaskComplete={handleTaskComplete}
          onClose={() => setShowTasks(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
