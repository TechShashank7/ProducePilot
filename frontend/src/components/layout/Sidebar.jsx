import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Map, Bot, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Inventory', icon: Package, path: '/inventory' },
    { name: 'Map', icon: Map, path: '/map' },
    { name: 'Agents', icon: Bot, path: '/agents' },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-bg-surface border-r border-border transition-all duration-300 flex flex-col z-20 ${
        collapsed ? 'w-16' : 'w-[240px]'
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="w-8 h-8 rounded bg-accent flex-shrink-0 flex items-center justify-center text-text-primary font-bold">
          P
        </div>
        {!collapsed && (
          <span className="ml-3 font-semibold text-text-primary text-lg whitespace-nowrap">
            ProducePilot
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-bg-hover border-l-2 border-accent text-accent'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border-l-2 border-transparent'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="ml-3 font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
