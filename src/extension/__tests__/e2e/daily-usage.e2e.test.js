"use strict";
/**
 * End-to-End Daily Usage Workflow Tests for EventConnect Extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@testing-library/react");
const google_api_mocks_1 = require("../mocks/google-api-mocks");
const TestApp = () => (/>
    < /EventProvider>
    < /AuthProvider>
    < /ErrorBoundary>);
describe('Daily Usage Workflows', () => {
    beforeEach(() => {
        (0, google_api_mocks_1.resetAllMocks)();
        // Mock Chrome APIs
        global.chrome = {
            ...global.chrome,
            tabs: {
                create: jest.fn()
            },
            storage: {
                local: {
                    get: jest.fn(),
                    set: jest.fn(),
                    clear: jest.fn()
                },
                onChanged: {
                    addListener: jest.fn(),
                    removeListener: jest.fn()
                }
            }
        };
    });
    describe('Event Status Check Flow', () => {
        it('should complete event status check workflow', async () => {
            // Setup: Mock authenticated user with current event
            const mockStorageData = {
                authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
                currentEventId: 'event-123'
            };
            chrome.storage.local.get.mockImplementation((keys) => {
                const result = {};
                if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        if (mockStorageData[key]) {
                            result[key] = mockStorageData[key];
                        }
                    });
                }
                return Promise.resolve(result);
            });
            // Mock successful API responses
            (0, google_api_mocks_1.mockSuccessfulSheetsAPI)();
            // Mock message passing to background script
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockImplementation((message) => {
                    if (message.type === 'AUTH_STATUS') {
                        return Promise.resolve({ authenticated: true });
                    }
                    if (message.type === 'GET_CURRENT_EVENT') {
                        return Promise.resolve({
                            event: {
                                id: 'event-123',
                                name: "Sarah's Wedding",
                                date: '2024-06-15',
                                sheetsId: 'sheet-123'
                            }
                        });
                    }
                    if (message.type === 'READ_EVENT_DATA') {
                        return Promise.resolve({ data: google_api_mocks_1.mockEventData });
                    }
                    return Promise.resolve({ success: true });
                })
            };
            (0, react_1.render)(/>);
            // ✅ Wait for authenticated state and current event to load
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText("Sarah's Wedding")).toBeInTheDocument();
            });
            // ✅ Click "View Event Status" button
            const statusButton = react_1.screen.getByText('View Event Status');
            react_1.fireEvent.click(statusButton);
            // ✅ Wait for status modal to appear with data from sheets
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText('Event Status')).toBeInTheDocument();
                expect(react_1.screen.getByText('Budget Overview')).toBeInTheDocument();
            });
            // ✅ Verify data matches actual Google Sheet contents
            expect(react_1.screen.getByText('$25,000')).toBeInTheDocument(); // Total budget
            expect(react_1.screen.getByText('$18,500')).toBeInTheDocument(); // Spent
            expect(react_1.screen.getByText('$6,500')).toBeInTheDocument(); // Remaining
            // ✅ Verify task progress is displayed correctly
            expect(react_1.screen.getByText('23 of 45 completed')).toBeInTheDocument();
        });
    });
    describe('Quick Update Flow', () => {
        it('should complete quick update workflow', async () => {
            // Setup authenticated state with current event
            const mockStorageData = {
                authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
                currentEventId: 'event-123'
            };
            chrome.storage.local.get.mockResolvedValue(mockStorageData);
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockImplementation((message) => {
                    if (message.type === 'AUTH_STATUS') {
                        return Promise.resolve({ authenticated: true });
                    }
                    if (message.type === 'GET_CURRENT_EVENT') {
                        return Promise.resolve({
                            event: {
                                id: 'event-123',
                                name: "Sarah's Wedding",
                                date: '2024-06-15',
                                sheetsId: 'sheet-123'
                            }
                        });
                    }
                    if (message.type === 'APPEND_LOG') {
                        return Promise.resolve({ success: true });
                    }
                    return Promise.resolve({ success: true });
                })
            };
            (0, react_1.render)(/>);
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText("Sarah's Wedding")).toBeInTheDocument();
            });
            // ✅ Click "Quick Update" button
            const updateButton = react_1.screen.getByText('Quick Update');
            react_1.fireEvent.click(updateButton);
            // ✅ Verify input field appears
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByPlaceholderText('Add a quick note or update...')).toBeInTheDocument();
            });
            // ✅ Enter note/update and verify character count
            const textarea = react_1.screen.getByPlaceholderText('Add a quick note or update...');
            const testUpdate = 'Confirmed final headcount with catering - 150 guests';
            react_1.fireEvent.change(textarea, { target: { value: testUpdate } });
            expect(react_1.screen.getByText(`${testUpdate.length}/500 characters`)).toBeInTheDocument();
            // ✅ Submit update
            const addButton = react_1.screen.getByText('Add Update');
            react_1.fireEvent.click(addButton);
            // ✅ Verify success confirmation
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText('Update added successfully!')).toBeInTheDocument();
            });
            // ✅ Verify API call was made with correct data
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: 'APPEND_LOG',
                payload: {
                    sheetId: 'sheet-123',
                    entry: testUpdate
                }
            }));
        });
    });
    describe('Next Tasks Flow', () => {
        it('should complete next tasks workflow', async () => {
            // Setup authenticated state
            const mockStorageData = {
                authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
                currentEventId: 'event-123'
            };
            chrome.storage.local.get.mockResolvedValue(mockStorageData);
            const mockTasks = [
                {
                    id: 'task-1',
                    name: 'Final dress fitting',
                    dueDate: '2024-05-15',
                    assignedTo: 'Sarah',
                    priority: 'high',
                    status: 'pending'
                },
                {
                    id: 'task-2',
                    name: 'Confirm catering headcount',
                    dueDate: '2024-05-20',
                    assignedTo: 'Wedding Planner',
                    priority: 'medium',
                    status: 'pending'
                }
            ];
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockImplementation((message) => {
                    if (message.type === 'AUTH_STATUS') {
                        return Promise.resolve({ authenticated: true });
                    }
                    if (message.type === 'GET_CURRENT_EVENT') {
                        return Promise.resolve({
                            event: {
                                id: 'event-123',
                                name: "Sarah's Wedding",
                                date: '2024-06-15',
                                sheetsId: 'sheet-123'
                            }
                        });
                    }
                    if (message.type === 'READ_EVENT_DATA') {
                        return Promise.resolve({
                            data: {
                                ...google_api_mocks_1.mockEventData,
                                tasks: {
                                    ...google_api_mocks_1.mockEventData.tasks,
                                    upcoming: mockTasks
                                }
                            }
                        });
                    }
                    if (message.type === 'APPEND_LOG') {
                        return Promise.resolve({ success: true });
                    }
                    return Promise.resolve({ success: true });
                })
            };
            (0, react_1.render)(/>);
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText("Sarah's Wedding")).toBeInTheDocument();
            });
            // ✅ Click "View Next Tasks" button
            const tasksButton = react_1.screen.getByText('View Next Tasks');
            react_1.fireEvent.click(tasksButton);
            // ✅ Wait for tasks modal to load
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText('Upcoming Tasks')).toBeInTheDocument();
            });
            // ✅ Verify task list displays correctly and is sorted by priority/date
            expect(react_1.screen.getByText('Final dress fitting')).toBeInTheDocument();
            expect(react_1.screen.getByText('Confirm catering headcount')).toBeInTheDocument();
            // High priority task should appear first
            const tasks = react_1.screen.getAllByText(/high|medium/);
            expect(tasks[0]).toHaveTextContent('high');
            // ✅ Mark task complete
            const completeButtons = react_1.screen.getAllByTitle('Complete task');
            react_1.fireEvent.click(completeButtons[0]);
            // ✅ Verify UI updates immediately
            await (0, react_1.waitFor)(() => {
                expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
                    type: 'APPEND_LOG',
                    payload: {
                        sheetId: 'sheet-123',
                        entry: 'Task completed: task-1'
                    }
                }));
            });
        });
    });
    describe('Error Scenarios', () => {
        it('should handle no internet connection gracefully', async () => {
            // Mock network failure
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockRejectedValue(new Error('Network error'))
            };
            (0, react_1.render)(/>);
            // Should show appropriate error message
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText(/Network error|connection/i)).toBeInTheDocument();
            });
        });
        it('should handle Google Sheets temporarily unavailable', async () => {
            const mockStorageData = {
                authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
                currentEventId: 'event-123'
            };
            chrome.storage.local.get.mockResolvedValue(mockStorageData);
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockImplementation((message) => {
                    if (message.type === 'AUTH_STATUS') {
                        return Promise.resolve({ authenticated: true });
                    }
                    if (message.type === 'GET_CURRENT_EVENT') {
                        return Promise.resolve({
                            event: {
                                id: 'event-123',
                                name: "Sarah's Wedding",
                                date: '2024-06-15',
                                sheetsId: 'sheet-123'
                            }
                        });
                    }
                    if (message.type === 'READ_EVENT_DATA') {
                        return Promise.resolve({ error: 'Google Sheets temporarily unavailable' });
                    }
                    return Promise.resolve({ success: true });
                })
            };
            (0, react_1.render)(/>);
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText("Sarah's Wedding")).toBeInTheDocument();
            });
            // Try to view status
            const statusButton = react_1.screen.getByText('View Event Status');
            react_1.fireEvent.click(statusButton);
            // Should show retry mechanism
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText(/temporarily unavailable|Try again/i)).toBeInTheDocument();
            });
        });
        it('should handle invalid event sheet format', async () => {
            const mockStorageData = {
                authToken: { access_token: 'mock_token', expires_at: Date.now() + 3600000 },
                currentEventId: 'event-123'
            };
            chrome.storage.local.get.mockResolvedValue(mockStorageData);
            global.chrome.runtime = {
                ...global.chrome.runtime,
                sendMessage: jest.fn().mockImplementation((message) => {
                    if (message.type === 'READ_EVENT_DATA') {
                        return Promise.resolve({ error: 'Sheet does not have the expected EventConnect structure' });
                    }
                    return Promise.resolve({ success: true, authenticated: true });
                })
            };
            (0, react_1.render)(/>);
            // Should show clear error with help
            await (0, react_1.waitFor)(() => {
                expect(react_1.screen.getByText(/expected EventConnect structure/i)).toBeInTheDocument();
            });
        });
    });
});
//# sourceMappingURL=daily-usage.e2e.test.js.map