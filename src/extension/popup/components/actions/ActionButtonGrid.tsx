import React from 'react';
import { EventStatusButton } from './EventStatusButton';
import { QuickUpdateButton } from './QuickUpdateButton';
import { NextTasksButton } from './NextTasksButton';
import { WhatsAppSenderButton } from './WhatsAppSenderButton';

export const ActionButtonGrid: React.FC = () => {
  return (
    <div className="space-y-3">
      <WhatsAppSenderButton />
      <EventStatusButton />
      <QuickUpdateButton />
      <NextTasksButton />
    </div>
  );
};
