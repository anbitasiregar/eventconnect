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
export declare const useEventData: () => {
    setCurrentEvent: (event: Event | null) => Promise<void>;
    getEventStatus: () => Promise<EventStatusDetails>;
    addEventLog: (entry: string) => Promise<void>;
    getUpcomingTasks: () => Promise<TaskItem[]>;
    markTaskComplete: (taskId: string) => Promise<void>;
    clearError: () => void;
    refreshCurrentEvent: () => Promise<any>;
    currentEvent: Event | null;
    eventStatus: EventStatus | null;
    isLoading: boolean;
    error: string | null;
};
export {};
//# sourceMappingURL=useEventData.d.ts.map