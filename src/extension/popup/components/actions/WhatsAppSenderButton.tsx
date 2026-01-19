/**
 * WhatsApp Sender Button Component
 * Primary action button for bulk WhatsApp invitation sending
 */

import React, { useState } from 'react';
import { useEventContext } from '../../context/EventContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WhatsAppSender } from '../WhatsAppSender';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { SendResult } from '../../../shared/whatsapp-types';

export const WhatsAppSenderButton: React.FC = () => {
  const { currentEvent } = useEventContext();
  const [showModal, setShowModal] = useState(false);

  const handleSendingComplete = (results: SendResult[]) => {
    // Handle completion - could show toast notification, etc.
    console.log('WhatsApp sending completed:', results);
    
    // Auto-close modal after a delay to show results
    setTimeout(() => {
      setShowModal(false);
    }, 5000);
  };

  // Don't show button if no current event
  if (!currentEvent) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
        Send WhatsApp Invitations
      </Button>

      {/* WhatsApp Sender Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="WhatsApp Bulk Sender"
        size="md"
      >
        <WhatsAppSender
          currentEventId={currentEvent.id}
          onSendingComplete={handleSendingComplete}
        />
      </Modal>
    </>
  );
};
