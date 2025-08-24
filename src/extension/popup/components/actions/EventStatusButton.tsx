import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ErrorMessage } from '../ui/ErrorMessage';
import { ChartBarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface EventStatusDetails {
  eventName: string;
  eventDate: string;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  tasks: {
    completed: number;
    total: number;
    upcoming: Array<{
      name: string;
      dueDate: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  vendors: Array<{
    name: string;
    category: string;
    status: string;
  }>;
}

interface StatusModalProps {
  data: EventStatusDetails;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ data, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBudgetHealthColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 20) return 'text-green-600';
    if (percentage > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Event Status" size="lg">
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
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${(data.tasks.completed / data.tasks.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        {data.tasks.upcoming.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
            <div className="space-y-2">
              {data.tasks.upcoming.slice(0, 3).map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{task.name}</div>
                    <div className="text-sm text-gray-600">{task.dueDate}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Status */}
        {data.vendors.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Key Vendors</h4>
            <div className="space-y-2">
              {data.vendors.slice(0, 3).map((vendor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-sm text-gray-600">{vendor.category}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vendor.status.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-800' :
                    vendor.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vendor.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const EventStatusButton: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const { getEventStatus, isLoading, error, currentEvent, clearError } = useEventContext();
  const [statusData, setStatusData] = useState<EventStatusDetails | null>(null);

  const handleViewStatus = async () => {
    if (!currentEvent) {
      return;
    }

    try {
      clearError();
      const data = await getEventStatus();
      setStatusData(data);
      setShowDetails(true);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to get event status:', err);
    }
  };

  return (
    <>
      <Button
        onClick={handleViewStatus}
        isLoading={isLoading}
        disabled={!currentEvent}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-5 h-5" />
          <span>View Event Status</span>
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

      {showDetails && statusData && (
        <StatusModal
          data={statusData}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};
