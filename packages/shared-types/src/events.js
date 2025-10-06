"use strict";
// Event-related types for EventConnect
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStatus = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["WEDDING"] = "wedding";
    EventType["CORPORATE"] = "corporate";
    EventType["PARTY"] = "party";
    EventType["CONFERENCE"] = "conference";
    EventType["OTHER"] = "other";
})(EventType || (exports.EventType = EventType = {}));
var EventStatus;
(function (EventStatus) {
    EventStatus["PLANNING"] = "planning";
    EventStatus["IN_PROGRESS"] = "in_progress";
    EventStatus["COMPLETED"] = "completed";
    EventStatus["CANCELLED"] = "cancelled";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
//# sourceMappingURL=events.js.map