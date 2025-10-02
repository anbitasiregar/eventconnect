import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEventContext } from '../../context/EventContext';

export const CeremonyRefreshButton: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const { currentEvent } = useEventContext();

  const handleRefreshCeremonies = async () => {
    if (!currentEvent) {
      setMessage('No event selected. Please connect to an event first.');
      setIsError(true);
      return;
    }

    try {
      setIsRefreshing(true);
      setMessage(null);
      setIsError(false);
      
      console.log('[CEREMONY REFRESH] Refreshing ceremony configuration...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CEREMONIES',
        payload: { sheetId: currentEvent.sheetsId }
      });
      
      if (response.success) {
        await chrome.storage.local.set({ eventCeremonies: response.data });
        
        setMessage(`Successfully configured ${response.data.length} ceremonies`);
        setIsError(false);
        
        console.log(`[CEREMONY REFRESH] Successfully configured ${response.data.length} ceremonies`);
        response.data.forEach((ceremony: any) => {
          console.log(`[CEREMONY REFRESH] - ${ceremony.name} (${ceremony.id}): ${ceremony.driveFileId}`);
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to refresh ceremonies');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Failed to refresh ceremonies: ${errorMessage}`);
      setIsError(true);
      console.error('[CEREMONY REFRESH] Error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleRefreshCeremonies}
        isLoading={isRefreshing}
        disabled={!currentEvent}
        variant="secondary"
        className="w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <ArrowPathIcon className="w-4 h-4" />
        <span>Refresh Ceremony Videos</span>
      </Button>
      
      {message && (
        <div className={`mt-2 p-2 rounded text-sm ${
          isError 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

