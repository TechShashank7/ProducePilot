import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-primary p-4 gap-6">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
