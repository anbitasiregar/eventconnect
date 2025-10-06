"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const react_1 = __importDefault(require("react"));
const AuthContext_1 = require("../context/AuthContext");
const Button_1 = require("./ui/Button");
const outline_1 = require("@heroicons/react/24/outline");
const Header = () => {
    const { isAuthenticated, userInfo, logout } = (0, AuthContext_1.useAuthContext)();
    return (<header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">EventConnect</h1>
            <p className="text-xs text-gray-500">AI Event Planning</p>
          </div>
        </div>

        {isAuthenticated && (<div className="flex items-center gap-2">
            {userInfo && (<div className="flex items-center gap-2 text-sm">
                {userInfo.picture ? (<img src={userInfo.picture} alt={userInfo.name} className="w-6 h-6 rounded-full"/>) : (<outline_1.UserCircleIcon className="w-6 h-6 text-gray-400"/>)}
                <span className="text-gray-700 hidden sm:inline">{userInfo.name}</span>
              </div>)}
            <Button_1.Button onClick={logout} variant="secondary" size="sm" className="p-1.5" title="Sign out">
              <outline_1.ArrowRightOnRectangleIcon className="w-4 h-4"/>
            </Button_1.Button>
          </div>)}
      </div>
    </header>);
};
exports.Header = Header;
//# sourceMappingURL=Header.js.map