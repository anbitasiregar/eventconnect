"use strict";
// AI Agent types for EventConnect
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.TaskStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["EVENT_CONTROLLER"] = "event_controller";
    AgentType["COMMUNICATIONS"] = "communications";
    AgentType["TIMELINE_BUDGET"] = "timeline_budget"; // Timeline & Budget Agent
})(AgentType || (exports.AgentType = AgentType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["AWAITING_APPROVAL"] = "awaiting_approval";
    TaskStatus["APPROVED"] = "approved";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["REJECTED"] = "rejected";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["SEND_EMAIL"] = "send_email";
    ActionType["UPDATE_SHEETS"] = "update_sheets";
    ActionType["CREATE_CALENDAR_EVENT"] = "create_calendar_event";
    ActionType["ANALYZE_BUDGET"] = "analyze_budget";
    ActionType["GENERATE_TIMELINE"] = "generate_timeline";
    ActionType["SEND_REMINDER"] = "send_reminder";
})(ActionType || (exports.ActionType = ActionType = {}));
//# sourceMappingURL=agents.js.map