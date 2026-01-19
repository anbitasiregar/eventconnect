/**
 * WhatsApp Bulk Sender Component
 * UI for sending bulk WhatsApp invitations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Guest, SendProgress, SendResult } from '../../shared/whatsapp-types';
import { sendMessageToBackground } from '../../shared/messaging';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Logger } from '../../shared/logger';

interface WhatsAppSenderProps {
  currentEventId: string | null;
  onSendingComplete: (results: SendResult[]) => void;
}

interface WhatsAppSenderState {
  pendingGuests: Guest[];
  isLoading: boolean;
  isSending: boolean;
  progress: SendProgress | null;
  results: SendResult[];
  error: string | null;
  showResults: boolean;
}

export const WhatsAppSender: React.FC<WhatsAppSenderProps> = ({ 
  currentEventId, 
  onSendingComplete 
}) => {
  const [state, setState] = useState<WhatsAppSenderState>({
    pendingGuests: [],
    isLoading: false,
    isSending: false,
    progress: null,
    results: [],
    error: null,
    showResults: false
  });

  // Load pending guests when component mounts
  useEffect(() => {
    if (currentEventId) {
      loadPendingGuests();
    }
  }, [currentEventId]);

  // Listen for progress updates during sending
  useEffect(() => {
    if (state.isSending) {
      const messageListener = (message: any) => {
        if (message.type === 'UPDATE_PROGRESS') {
          setState(prev => ({ ...prev, progress: message.payload }));
        } else if (message.type === 'SENDING_COMPLETE') {
          handleSendingComplete(message.payload);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, [state.isSending]);

  const loadPendingGuests = useCallback(async () => {
    if (!currentEventId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      Logger.info('Loading pending WhatsApp guests');

      const response = await sendMessageToBackground({
        type: 'GET_PENDING_WHATSAPP_GUESTS',
        payload: { sheetId: currentEventId }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const guests = response.data || [];
      Logger.info(`Loaded ${guests.length} pending guests`);

      setState(prev => ({
        ...prev,
        pendingGuests: guests,
        isLoading: false,
        showResults: false,
        results: []
      }));

    } catch (error) {
      Logger.error('Failed to load pending guests', error as Error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load pending guests'
      }));
    }
  }, [currentEventId]);

  const startBulkSending = useCallback(async () => {
    if (state.pendingGuests.length === 0) return;

    setState(prev => ({
      ...prev,
      isSending: true,
      error: null,
      progress: {
        totalGuests: prev.pendingGuests.length,
        currentGuest: 0,
        successCount: 0,
        errorCount: 0,
        currentGuestName: '',
        isComplete: false
      }
    }));

    try {
      Logger.info(`Starting bulk WhatsApp send for ${state.pendingGuests.length} guests`);

      const response = await sendMessageToBackground({
        type: 'START_BULK_WHATSAPP_SEND',
        payload: { guests: state.pendingGuests }
      });

      if (response.error) {
        throw new Error(response.error);
      }

    } catch (error) {
      Logger.error('Failed to start bulk sending', error as Error);
      setState(prev => ({
        ...prev,
        isSending: false,
        error: error instanceof Error ? error.message : 'Failed to start sending'
      }));
    }
  }, [state.pendingGuests]);

  const handleSendingComplete = useCallback((payload: any) => {
    Logger.info('Bulk sending completed', payload);

    setState(prev => ({
      ...prev,
      isSending: false,
      results: payload.results || [],
      showResults: true,
      error: payload.error || null
    }));

    // Reload guests to reflect updated statuses
    setTimeout(() => {
      loadPendingGuests();
    }, 1000);

    // Notify parent component
    onSendingComplete(payload.results || []);
  }, [loadPendingGuests, onSendingComplete]);

  const retryFailedSends = useCallback(async () => {
    const failedGuests = state.results
      .filter(result => !result.success)
      .map(result => state.pendingGuests.find(guest => guest.fullName === result.guestName))
      .filter(Boolean) as Guest[];

    if (failedGuests.length === 0) return;

    setState(prev => ({
      ...prev,
      isSending: true,
      error: null,
      showResults: false,
      progress: {
        totalGuests: failedGuests.length,
        currentGuest: 0,
        successCount: 0,
        errorCount: 0,
        currentGuestName: '',
        isComplete: false
      }
    }));

    try {
      const response = await sendMessageToBackground({
        type: 'START_BULK_WHATSAPP_SEND',
        payload: { guests: failedGuests }
      });

      if (response.error) {
        throw new Error(response.error);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSending: false,
        error: error instanceof Error ? error.message : 'Failed to retry sending'
      }));
    }
  }, [state.results, state.pendingGuests]);

  // Render loading state
  if (state.isLoading) {
    return (
      <div className="text-center p-6">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Loading pending invitations...</p>
      </div>
    );
  }

  // Render error state
  if (state.error && !state.isSending) {
    return (
      <div className="p-4">
        <ErrorMessage message={state.error} />
        <Button
          onClick={loadPendingGuests}
          variant="secondary"
          size="sm"
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Render no guests state
  if (state.pendingGuests.length === 0 && !state.isLoading) {
    return (
      <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
        <p className="text-gray-600 text-sm mb-4">
          No pending WhatsApp invitations found. All guests have been invited or don't need WhatsApp invitations.
        </p>
        <Button
          onClick={loadPendingGuests}
          variant="secondary"
          size="sm"
        >
          Refresh
        </Button>
      </div>
    );
  }

  // Render sending progress
  if (state.isSending && state.progress) {
    const { progress } = state;
    const progressPercentage = progress.totalGuests > 0 
      ? Math.round((progress.currentGuest / progress.totalGuests) * 100)
      : 0;

    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sending Invitations
          </h3>
          <p className="text-gray-600">
            {progress.isComplete 
              ? 'Sending complete!' 
              : `Sending to ${progress.currentGuestName}...`
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{progress.currentGuest}/{progress.totalGuests}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {progress.successCount}
            </div>
            <div className="text-sm text-green-700">Successful</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {progress.errorCount}
            </div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>
      </div>
    );
  }

  // Render results summary
  if (state.showResults && state.results.length > 0) {
    const successCount = state.results.filter(r => r.success).length;
    const failedCount = state.results.filter(r => !r.success).length;
    const failedResults = state.results.filter(r => !r.success);

    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            failedCount === 0 ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {failedCount === 0 ? (
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            ) : (
              <XCircleIcon className="w-8 h-8 text-yellow-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sending Complete
          </h3>
          <p className="text-gray-600">
            {successCount}/{state.results.length} invitations sent successfully
          </p>
        </div>

        {/* Results Stats */}
        <div className="grid grid-cols-2 gap-4 text-center mb-6">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-green-700">Successful</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
        </div>

        {/* Failed sends details */}
        {failedResults.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Failed Sends:</h4>
            <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {failedResults.map((result, index) => (
                <div key={index} className="text-sm text-red-700 mb-1">
                  <span className="font-medium">{result.guestName}</span>
                  {result.error && <span className="text-red-600"> - {result.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {failedResults.length > 0 && (
            <Button
              onClick={retryFailedSends}
              className="w-full"
              variant="secondary"
            >
              Retry Failed Sends ({failedResults.length})
            </Button>
          )}
          <Button
            onClick={loadPendingGuests}
            className="w-full"
            variant="secondary"
          >
            Refresh Guest List
          </Button>
        </div>
      </div>
    );
  }

  // Render main sending interface
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          WhatsApp Invitations
        </h3>
        <p className="text-gray-600">
          {state.pendingGuests.length} guest{state.pendingGuests.length !== 1 ? 's' : ''} ready to receive invitations
        </p>
      </div>

      {/* Guest preview */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Ready to send to:</h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {state.pendingGuests.slice(0, 5).map((guest, index) => (
            <div key={index} className="text-sm text-gray-700 flex justify-between">
              <span>{guest.fullName}</span>
              <span className="text-gray-500">{guest.whatsappNumber}</span>
            </div>
          ))}
          {state.pendingGuests.length > 5 && (
            <div className="text-sm text-gray-500 italic">
              ...and {state.pendingGuests.length - 5} more
            </div>
          )}
        </div>
      </div>

      {/* Send button */}
      <Button
        onClick={startBulkSending}
        disabled={state.pendingGuests.length === 0 || state.isSending}
        className="w-full"
        size="lg"
      >
        Send All Pending Invitations ({state.pendingGuests.length})
      </Button>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          Make sure WhatsApp Web is logged in. The extension will open WhatsApp Web and 
          send invitations automatically.
        </p>
      </div>
    </div>
  );
};
