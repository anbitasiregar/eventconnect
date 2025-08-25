import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Button } from '../ui/Button';
import { CalendarIcon, LinkIcon } from '@heroicons/react/24/outline';
import { EventSetup } from './EventSetup';

export const EventSelector: React.FC = () => {
  const { currentEvent, setCurrentEvent } = useEventContext();
  const [showEventSetup, setShowEventSetup] = useState(false);
  
  const handleEventConnected = (eventId: string, eventName: string) => {
    // Update the current event in context
    setCurrentEvent({
      id: eventId,
      name: eventName,
      sheetsId: eventId,
      date: new Date().toLocaleDateString(),
      status: 'in_progress'
    });
    
    setShowEventSetup(false);
  };
  
  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Event
        </label>
        
        {currentEvent ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">{currentEvent.name}</h3>
                  <p className="text-sm text-blue-700 mb-1">{currentEvent.date}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      currentEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                      currentEvent.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentEvent.status === 'in_progress' ? 'In Progress' : 
                       currentEvent.status.charAt(0).toUpperCase() + currentEvent.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentEvent(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              No event selected. Connect your event dashboard to get started.
            </p>
            {/* ONLY THIS BUTTON CHANGED */}
            <Button
              onClick={() => setShowEventSetup(true)}
              variant="secondary"
              size="sm"
              className="inline-flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Connect Google Sheets
            </Button>
          </div>
        )}
      </div>

      {/* Modal for event setup */}
      {showEventSetup && (
        <EventSetup 
          onEventConnected={handleEventConnected}
          onCancel={() => setShowEventSetup(false)}
        />
      )}
    </>
  );
};