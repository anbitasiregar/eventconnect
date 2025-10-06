"use strict";
// Chrome extension message types and interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    // Authentication messages
    MessageType["AUTH_LOGIN"] = "auth_login";
    MessageType["AUTH_LOGOUT"] = "auth_logout";
    MessageType["AUTH_STATUS"] = "auth_status";
    MessageType["AUTH_REFRESH"] = "auth_refresh";
    MessageType["GET_USER_INFO"] = "get_user_info";
    // Event management
    MessageType["GET_CURRENT_EVENT"] = "get_current_event";
    MessageType["SET_CURRENT_EVENT"] = "set_current_event";
    MessageType["VALIDATE_SHEET"] = "validate_sheet";
    // Sheet operations
    MessageType["READ_EVENT_DATA"] = "read_event_data";
    MessageType["UPDATE_EVENT_DATA"] = "update_event_data";
    MessageType["APPEND_LOG"] = "append_log";
    // Action execution
    MessageType["EXECUTE_ACTION"] = "execute_action";
    MessageType["GET_ACTION_SUGGESTIONS"] = "get_action_suggestions";
    // Legacy support
    MessageType["LOGIN_REQUEST"] = "login_request";
    MessageType["LOGOUT_REQUEST"] = "logout_request";
    // Page Context
    MessageType["ANALYZE_PAGE"] = "analyze_page";
    MessageType["GET_SUGGESTIONS"] = "get_suggestions";
    // Storage
    MessageType["STORAGE_GET"] = "storage_get";
    MessageType["STORAGE_SET"] = "storage_set";
    MessageType["STORAGE_CLEAR"] = "storage_clear";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=chrome-extension.js.map