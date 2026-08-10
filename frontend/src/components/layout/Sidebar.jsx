import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Map, Bot, ChevronLeft, ChevronRight, Calculator, Wrench, Settings, LogOut, HelpCircle } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app' },
    { name: 'Inventory', icon: Package, path: '/app/inventory' },
    { name: 'Map', icon: Map, path: '/app/map' },
    { name: 'Agents', icon: Bot, path: '/app/agents' },
  ];

  return (
    <div
      className={`relative h-full bg-primary rounded-3xl transition-all duration-300 flex flex-col shadow-lg overflow-hidden ${
        collapsed ? 'w-20' : 'w-sidebar-width flex-shrink-0'
      }`}
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold">
          P
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-white text-sm truncate">ProducePilot</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/app'
            ? location.pathname === '/app' || location.pathname === '/app/'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-2.5 rounded-full cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white text-primary font-semibold shadow-sm'
                  : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="ml-3 text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        {!collapsed && (
          <button className="w-full bg-white text-primary font-semibold text-sm rounded-full py-2.5 mb-6 shadow-sm hover:bg-white/90 transition-colors">
            + New Batch
          </button>
        )}
        
        <div className="flex flex-col gap-2 px-4 mb-4">
          <button className="flex items-center text-white/80 hover:text-white transition-colors">
             <HelpCircle size={18} />
             {!collapsed && <span className="ml-3 text-sm font-medium">Support</span>}
          </button>
          <button className="flex items-center text-white/80 hover:text-white transition-colors mt-2">
             <LogOut size={18} />
             {!collapsed && <span className="ml-3 text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
