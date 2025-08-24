import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';

export const QuickUpdateButton: React.FC = () => {
  const [showInput, setShowInput] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { addEventLog, isLoading, error, currentEvent, clearError } = useEventContext();

  const handleQuickUpdate = async () => {
    if (!updateText.trim() || !currentEvent) return;

    try {
      clearError();
      await addEventLog(updateText.trim());
      setUpdateText('');
      setShowInput(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to add update:', err);
    }
  };

  const handleCancel = () => {
    setShowInput(false);
    setUpdateText('');
    clearError();
  };

  return (
    <>
      <Button
        onClick={() => setShowInput(true)}
        disabled={!currentEvent}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <PencilIcon className="w-5 h-5" />
          <span>Quick Update</span>
        </div>
        <PlusIcon className="w-4 h-4" />
      </Button>

      {showSuccess && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
              </svg>
            </div>
            <p className="text-sm text-green-800">Update added successfully!</p>
          </div>
        </div>
      )}

      {error && (
        <ErrorMessage 
          message={error} 
          className="mt-2"
          onRetry={clearError}
        />
      )}

      {showInput && (
        <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Add a quick note or update..."
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {updateText.length}/500 characters
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                disabled={isLoading}
              >
                Cancel
              </button>
              <Button
                onClick={handleQuickUpdate}
                disabled={!updateText.trim() || isLoading}
                isLoading={isLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Adding...' : 'Add Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
