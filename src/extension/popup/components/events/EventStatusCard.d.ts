import React from 'react';
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
export declare const EventStatusCard: React.FC<EventStatusCardProps>;
export {};
//# sourceMappingURL=EventStatusCard.d.ts.map