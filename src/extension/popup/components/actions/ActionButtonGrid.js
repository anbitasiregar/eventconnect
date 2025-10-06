"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionButtonGrid = void 0;
const react_1 = __importDefault(require("react"));
const EventStatusButton_1 = require("./EventStatusButton");
const QuickUpdateButton_1 = require("./QuickUpdateButton");
const NextTasksButton_1 = require("./NextTasksButton");
const ActionButtonGrid = () => {
    return (<div className="space-y-3">
      <EventStatusButton_1.EventStatusButton />
      <QuickUpdateButton_1.QuickUpdateButton />
      <NextTasksButton_1.NextTasksButton />
    </div>);
};
exports.ActionButtonGrid = ActionButtonGrid;
//# sourceMappingURL=ActionButtonGrid.js.map