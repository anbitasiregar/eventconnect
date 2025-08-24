import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthGuard } from './auth/AuthGuard';
import { EventSelector } from './events/EventSelector';
import { ActionButtonGrid } from './actions/ActionButtonGrid';

export const App: React.FC = () => {
  return (
    <div className="extension-popup bg-white flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <AuthGuard>
          <EventSelector />
          <ActionButtonGrid />
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
};
