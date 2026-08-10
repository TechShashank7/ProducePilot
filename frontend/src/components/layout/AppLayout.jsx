import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-[240px] transition-all duration-300">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
