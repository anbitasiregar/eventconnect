import React, { createContext, useContext } from 'react';
import { useEventData } from '../hooks/useEventData';

interface Event {
  id: string;
  name: string;
  date: string;
  sheetsId: string;
  status: 'planning' | 'in_progress' | 'completed';
}

interface TaskItem {
  id: string;
  name: string;
  dueDate: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

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
    upcoming: TaskItem[];
  };
  vendors: Array<{
    name: string;
    category: string;
    status: string;
  }>;
}

interface EventContextType {
  currentEvent: Event | null;
  setCurrentEvent: (event: Event | null) => Promise<void>;
  getEventStatus: () => Promise<EventStatusDetails>;
  addEventLog: (entry: string) => Promise<void>;
  getUpcomingTasks: () => Promise<TaskItem[]>;
  markTaskComplete: (taskId: string) => Promise<void>;
  refreshCurrentEvent: () => Promise<Event | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const EventContext = createContext<EventContextType | null>(null);

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const eventData = useEventData();

  return (
    <EventContext.Provider value={eventData}>
      {children}
    </EventContext.Provider>
  );
};
