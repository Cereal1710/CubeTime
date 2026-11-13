import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useSessionStore } from '../stores/useSessionStore';

export const App: React.FC = () => {
  const init = useSessionStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text">
      {/* Desktop sidebar / Mobile bottom nav */}
      <Sidebar />

      {/* Main Page Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

