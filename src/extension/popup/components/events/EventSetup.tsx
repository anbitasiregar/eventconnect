import React, { useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface EventSetupProps {
  onEventConnected: (eventId: string, eventName: string) => void;
  onCancel: () => void;
}

export const EventSetup: React.FC<EventSetupProps> = ({ onEventConnected, onCancel }) => {
  const [sheetId, setSheetId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSheetId = (input: string): string => {
    // Handle full Google Sheets URL
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Handle direct sheet ID
    return input.trim();
  };

  const connectSheet = async () => {
    const cleanSheetId = extractSheetId(sheetId);
    
    if (!cleanSheetId) {
      setError('Please enter a valid Google Sheets URL or ID');
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      console.log('Attempting to connect to sheet:', cleanSheetId);
      
      const response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_SHEET',
        payload: { sheetId: cleanSheetId }
      });

      if (response.success) {
        await chrome.runtime.sendMessage({
          type: 'SET_CURRENT_EVENT',
          payload: { eventId: cleanSheetId }
        });
        
        console.log('Event dashboard connected successfully');
        console.log('Sheet structure:', response.structure);
        
        onEventConnected(cleanSheetId, response.eventName || 'Event Dashboard');
      } else {
        // Handle specific README error with helpful message
        if (response.error?.includes('README tab not found')) {
          setError(
            'README tab not found in your Google Sheets. Please create a README tab with a table containing columns: Tab, Header Row, Column, Column Description. This helps EventConnect understand your sheet structure.'
          );
        } else {
          setError(response.error || 'Could not connect to sheet. Please check the Sheet ID and sharing permissions.');
        }
      }
    } catch (error) {
      console.error('Sheet connection failed:', error);
      setError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const openSheetCreationHelp = () => {
    chrome.tabs.create({ 
      url: 'https://docs.google.com/spreadsheets/create',
      active: false 
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connect Your Event Dashboard
        </h3>
        <p className="text-sm text-gray-600">
          Connect your Google Sheets event dashboard to start managing your event.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-2">
            Google Sheets URL or ID
          </label>
          <input
            id="sheetId"
            type="text"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit or just the Sheet ID"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isConnecting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the full URL or just the Sheet ID (found between /d/ and /edit in the URL)
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={connectSheet}
            disabled={!sheetId.trim() || isConnecting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg 
                       font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Connect Dashboard
              </>
            )}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isConnecting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 
                       font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-600 mb-2">Don't have an event dashboard yet?</p>
          <button
            onClick={openSheetCreationHelp}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Create New Google Sheets Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};