import { useState, useEffect, useCallback } from 'react';
import { sendMessageToBackground } from '../../shared/messaging';

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

interface EventStatus {
  budgetHealth: 'good' | 'warning' | 'danger';
  upcomingDeadlines: number;
  completedTasks: number;
  totalTasks: number;
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

interface EventDataState {
  currentEvent: Event | null;
  eventStatus: EventStatus | null;
  isLoading: boolean;
  error: string | null;
}

export const useEventData = () => {
  const [state, setState] = useState<EventDataState>({
    currentEvent: null,
    eventStatus: null,
    isLoading: false,
    error: null
  });

  const getCurrentEvent = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'GET_CURRENT_EVENT'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({
        ...prev,
        currentEvent: response.event,
        isLoading: false
      }));

      return response.event;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get current event'
      }));
      return null;
    }
  }, []);

  const setCurrentEvent = useCallback(async (event: Event | null) => {
    if (!event) {
      setState(prev => ({ ...prev, currentEvent: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'SET_CURRENT_EVENT',
        payload: { eventId: event.id }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({
        ...prev,
        currentEvent: event,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to set current event'
      }));
    }
  }, []);

  const getEventStatus = useCallback(async (): Promise<EventStatusDetails> => {
    if (!state.currentEvent) {
      throw new Error('No current event selected');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'READ_EVENT_DATA',
        payload: { sheetId: state.currentEvent.sheetsId }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get event status'
      }));
      throw error;
    }
  }, [state.currentEvent]);

  const addEventLog = useCallback(async (entry: string) => {
    if (!state.currentEvent) {
      throw new Error('No current event selected');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'APPEND_LOG',
        payload: { 
          sheetId: state.currentEvent.sheetsId,
          entry 
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add event log'
      }));
      throw error;
    }
  }, [state.currentEvent]);

  const getUpcomingTasks = useCallback(async (): Promise<TaskItem[]> => {
    if (!state.currentEvent) {
      throw new Error('No current event selected');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await sendMessageToBackground({
        type: 'READ_EVENT_DATA',
        payload: { sheetId: state.currentEvent.sheetsId }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      
      // Extract upcoming tasks from event data
      const upcomingTasks = response.data.tasks?.upcoming || [];
      return upcomingTasks;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming tasks'
      }));
      throw error;
    }
  }, [state.currentEvent]);

  const markTaskComplete = useCallback(async (taskId: string) => {
    if (!state.currentEvent) {
      throw new Error('No current event selected');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // For now, add a log entry about task completion
      // In a full implementation, this would update the specific task in the sheet
      const response = await sendMessageToBackground({
        type: 'APPEND_LOG',
        payload: { 
          sheetId: state.currentEvent.sheetsId,
          entry: `Task completed: ${taskId}` 
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to mark task complete'
      }));
      throw error;
    }
  }, [state.currentEvent]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load current event on mount
  useEffect(() => {
    getCurrentEvent();
  }, [getCurrentEvent]);

  return {
    ...state,
    setCurrentEvent,
    getEventStatus,
    addEventLog,
    getUpcomingTasks,
    markTaskComplete,
    clearError,
    refreshCurrentEvent: getCurrentEvent
  };
};
