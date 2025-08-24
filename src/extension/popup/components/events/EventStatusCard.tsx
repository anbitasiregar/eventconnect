import React from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface EventStatus {
  budgetHealth: 'good' | 'warning' | 'danger';
  upcomingDeadlines: number;
  completedTasks: number;
  totalTasks: number;
}

interface EventStatusCardProps {
  eventStatus: EventStatus | null;
  isLoading: boolean;
}

const getBudgetColor = (health: EventStatus['budgetHealth']) => {
  switch (health) {
    case 'good': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'danger': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getBudgetIcon = (health: EventStatus['budgetHealth']) => {
  switch (health) {
    case 'good': return '✓';
    case 'warning': return '!';
    case 'danger': return '⚠️';
    default: return '?';
  }
};

const LoadingSkeleton: React.FC = () => (
  <div className="bg-gray-50 rounded-lg p-4 mb-4">
    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
        </div>
      ))}
    </div>
  </div>
);

export const EventStatusCard: React.FC<EventStatusCardProps> = ({ 
  eventStatus, 
  isLoading 
}) => {
  if (isLoading) return <LoadingSkeleton />;
  if (!eventStatus) return null;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-gray-900 mb-3">Event Overview</h4>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className={`text-lg font-semibold ${getBudgetColor(eventStatus.budgetHealth)}`}>
            {getBudgetIcon(eventStatus.budgetHealth)}
          </div>
          <div className="text-xs text-gray-600">Budget</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold text-orange-600">
            {eventStatus.upcomingDeadlines}
          </div>
          <div className="text-xs text-gray-600">Due Soon</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold text-green-600">
            {eventStatus.completedTasks}/{eventStatus.totalTasks}
          </div>
          <div className="text-xs text-gray-600">Tasks</div>
        </div>
      </div>
    </div>
  );
};
