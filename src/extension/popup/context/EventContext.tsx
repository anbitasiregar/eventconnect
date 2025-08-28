import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface EventOverviewData {
  eventName: string;
  totalTabs: number;
  tabSummaries: Record<string, any>;
  keyMetrics: Record<string, any>;
}

interface EventContextType {
  currentEvent: Event | null;
  eventData: EventOverviewData | null;
  setCurrentEvent: (event: Event | null) => Promise<void>;
  getEventStatus: () => Promise<EventStatusDetails>;
  addEventLog: (entry: string) => Promise<void>;
  getUpcomingTasks: () => Promise<TaskItem[]>;
  markTaskComplete: (taskId: string) => Promise<void>;
  refreshCurrentEvent: () => Promise<Event | null>;
  getEventOverview: () => Promise<EventOverviewData | null>;
  addQuickNote: (note: string) => Promise<boolean>;
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
  const [state, setState] = useState({
    currentEvent: null as Event | null,
    eventData: null as EventOverviewData | null,
    isLoading: true,
    error: null as string | null
  });

  // Load stored event on mount
  useEffect(() => {
    loadStoredEvent();
  }, []);

  const loadStoredEvent = async () => {
    try {
      console.log('Loading stored event from storage...');
      
      const stored = await chrome.storage.local.get([
        'currentEventId',
        'currentEventTimestamp'
      ]);

      if (stored.currentEventId) {
        console.log('Found stored event:', stored.currentEventId);
        
        // Check if storage is fresh (within 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const timestamp = stored.currentEventTimestamp || 0;
        
        if (timestamp > thirtyDaysAgo) {
          // Get sheet structure to validate sheet still exists
          const response = await chrome.runtime.sendMessage({
            type: 'GET_SHEET_INFO',
            payload: { sheetId: stored.currentEventId }
          });

          if (response.success) {
            setState(prev => ({
              ...prev,
              currentEvent: {
                id: stored.currentEventId,
                name: response.eventName || 'Connected Event Dashboard',
                date: new Date().toLocaleDateString(),
                status: 'in_progress',
                sheetsId: stored.currentEventId
              },
              isLoading: false
            }));
            
            // Load event data in background
            loadEventData(stored.currentEventId);
            return;
          } else {
            console.log('Stored sheet no longer accessible, clearing...');
            await chrome.storage.local.remove(['currentEventId', 'currentEventTimestamp']);
          }
        } else {
          console.log('Stored event too old, clearing...');
          await chrome.storage.local.remove(['currentEventId', 'currentEventTimestamp']);
        }
      }
      
      // No valid stored event
      setState(prev => ({
        ...prev,
        currentEvent: null,
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Error loading stored event:', error);
      setState(prev => ({
        ...prev,
        currentEvent: null,
        isLoading: false,
        error: 'Failed to load stored event'
      }));
    }
  };

  const loadEventData = async (sheetId: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'READ_EVENT_OVERVIEW',
        payload: { sheetId }
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          eventData: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading event data:', error);
    }
  };

  const setCurrentEvent = async (event: Event | null) => {
    if (event) {
      // Store event persistently
      await chrome.storage.local.set({
        currentEventId: event.sheetsId || event.id,
        currentEventTimestamp: Date.now()
      });
      
      setState(prev => ({
        ...prev,
        currentEvent: event,
        error: null
      }));
      
      // Load event data
      await loadEventData(event.sheetsId || event.id);
    } else {
      // Clear stored event
      await chrome.storage.local.remove(['currentEventId', 'currentEventTimestamp']);
      setState(prev => ({
        ...prev,
        currentEvent: null,
        eventData: null,
        error: null
      }));
    }
  };

  const getEventOverview = async (): Promise<EventOverviewData | null> => {
    if (!state.currentEvent?.sheetsId) return null;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await chrome.runtime.sendMessage({
        type: 'READ_EVENT_OVERVIEW',
        payload: { sheetId: state.currentEvent.sheetsId }
      });

      if (response.success) {
        setState(prev => ({ ...prev, eventData: response.data }));
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error getting event overview:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load event data'
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addQuickNote = async (note: string): Promise<boolean> => {
    if (!state.currentEvent?.sheetsId) return false;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_QUICK_NOTE',
        payload: { 
          sheetId: state.currentEvent.sheetsId, 
          note: `${new Date().toLocaleString()}: ${note}`
        }
      });

      if (response.success) {
        return true;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error adding quick note:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add note'
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Placeholder implementations for existing methods
  const getEventStatus = async (): Promise<EventStatusDetails> => {
    // TODO: Implement using structure-aware services
    throw new Error('Not yet implemented with structure-aware services');
  };

  const addEventLog = async (entry: string): Promise<void> => {
    // Use addQuickNote for now
    await addQuickNote(entry);
  };

  const getUpcomingTasks = async (): Promise<TaskItem[]> => {
    // TODO: Implement using structure-aware services
    return [];
  };

  const markTaskComplete = async (taskId: string): Promise<void> => {
    // TODO: Implement using structure-aware services
    throw new Error('Not yet implemented with structure-aware services');
  };

  const refreshCurrentEvent = async (): Promise<Event | null> => {
    if (state.currentEvent) {
      await loadEventData(state.currentEvent.sheetsId);
    }
    return state.currentEvent;
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: EventContextType = {
    currentEvent: state.currentEvent,
    eventData: state.eventData,
    setCurrentEvent,
    getEventStatus,
    addEventLog,
    getUpcomingTasks,
    markTaskComplete,
    refreshCurrentEvent,
    getEventOverview,
    addQuickNote,
    isLoading: state.isLoading,
    error: state.error,
    clearError
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};