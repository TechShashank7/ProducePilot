import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12121a] border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">ProducePilot</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className="block p-2 rounded hover:bg-gray-800 transition-colors">Dashboard</Link>
          <Link to="/inventory" className="block p-2 rounded hover:bg-gray-800 transition-colors">Inventory</Link>
          <Link to="/agents" className="block p-2 rounded hover:bg-gray-800 transition-colors">Agents</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-[#12121a] border-b border-gray-800 flex items-center px-6 justify-between">
          <div className="font-medium text-gray-400">Welcome User</div>
          <Link to="/login" className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors">Logout</Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
