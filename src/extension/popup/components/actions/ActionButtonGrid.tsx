import React from 'react';
import { EventStatusButton } from './EventStatusButton';
import { QuickUpdateButton } from './QuickUpdateButton';
import { NextTasksButton } from './NextTasksButton';

export const ActionButtonGrid: React.FC = () => {
  return (
    <div className="space-y-3">
      <EventStatusButton />
      <QuickUpdateButton />
      <NextTasksButton />
    </div>
  );
};
