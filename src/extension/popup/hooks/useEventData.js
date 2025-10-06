"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEventData = void 0;
const react_1 = require("react");
const messaging_1 = require("../../shared/messaging");
const useEventData = () => {
    const [state, setState] = (0, react_1.useState)({
        currentEvent: null,
        eventStatus: null,
        isLoading: false,
        error: null
    });
    const getCurrentEvent = (0, react_1.useCallback)(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to get current event'
            }));
            return null;
        }
    }, []);
    const setCurrentEvent = (0, react_1.useCallback)(async (event) => {
        if (!event) {
            setState(prev => ({ ...prev, currentEvent: null }));
            return;
        }
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to set current event'
            }));
        }
    }, []);
    const getEventStatus = (0, react_1.useCallback)(async () => {
        if (!state.currentEvent) {
            throw new Error('No current event selected');
        }
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
                type: 'READ_EVENT_DATA',
                payload: { sheetId: state.currentEvent.sheetsId }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            setState(prev => ({ ...prev, isLoading: false }));
            return response.data;
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to get event status'
            }));
            throw error;
        }
    }, [state.currentEvent]);
    const addEventLog = (0, react_1.useCallback)(async (entry) => {
        if (!state.currentEvent) {
            throw new Error('No current event selected');
        }
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to add event log'
            }));
            throw error;
        }
    }, [state.currentEvent]);
    const getUpcomingTasks = (0, react_1.useCallback)(async () => {
        if (!state.currentEvent) {
            throw new Error('No current event selected');
        }
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to get upcoming tasks'
            }));
            throw error;
        }
    }, [state.currentEvent]);
    const markTaskComplete = (0, react_1.useCallback)(async (taskId) => {
        if (!state.currentEvent) {
            throw new Error('No current event selected');
        }
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            // For now, add a log entry about task completion
            // In a full implementation, this would update the specific task in the sheet
            const response = await (0, messaging_1.sendMessageToBackground)({
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
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to mark task complete'
            }));
            throw error;
        }
    }, [state.currentEvent]);
    const clearError = (0, react_1.useCallback)(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);
    // Load current event on mount
    (0, react_1.useEffect)(() => {
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
exports.useEventData = useEventData;
//# sourceMappingURL=useEventData.js.map