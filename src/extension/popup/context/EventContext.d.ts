import React from 'react';
interface Event {
    id: string;
    name: string;
    date: string;
    sheetsId: string;
    status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
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
export declare const useEventContext: () => EventContextType;
export declare const EventProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=EventContext.d.ts.map