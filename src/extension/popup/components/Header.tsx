import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { Button } from './ui/Button';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const { isAuthenticated, userInfo, logout } = useAuthContext();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
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

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {userInfo && (
              <div className="flex items-center gap-2 text-sm">
                {userInfo.picture ? (
                  <img 
                    src={userInfo.picture} 
                    alt={userInfo.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-gray-700 hidden sm:inline">{userInfo.name}</span>
              </div>
            )}
            <Button
              onClick={logout}
              variant="secondary"
              size="sm"
              className="p-1.5"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
