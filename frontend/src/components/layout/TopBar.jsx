import React from 'react';
import { Search, ChevronDown, User, Bell } from 'lucide-react';
import { useWarehouse } from '../../context/WarehouseContext';

const TopBar = () => {
  const { warehouses, selectedWarehouseId, setSelectedWarehouseId, loading } = useWarehouse();
  
  const selectedWarehouse = warehouses.find(w => w._id === selectedWarehouseId);
  const displayName = loading ? 'Loading...' : (selectedWarehouse?.name || 'All Warehouses');

  return (
    <div className="h-16 bg-bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <button className="flex items-center gap-2 text-text-primary bg-bg-elevated px-3 py-1.5 rounded-md border border-border hover:border-border-strong transition-colors">
            <span className="font-medium text-sm">{displayName}</span>
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
          
          {/* Simple Dropdown on Hover for now */}
          {!loading && warehouses.length > 0 && (
            <div className="absolute left-0 top-full pt-1 w-56 hidden group-hover:block z-50">
              <div className="bg-bg-elevated border border-border rounded-md shadow-lg py-1">
                {warehouses.map(w => (
                  <button
                    key={w._id}
                    onClick={() => setSelectedWarehouseId(w._id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-hover transition-colors ${selectedWarehouseId === w._id ? 'text-accent font-medium' : 'text-text-primary'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search inventory, agents..."
            className="bg-bg-elevated border border-border text-text-primary text-sm rounded-md pl-10 pr-4 py-1.5 focus:outline-none focus:border-accent w-64 transition-colors placeholder:text-text-muted"
          />
        </div>

        <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full border border-bg-surface"></span>
        </button>

        <button className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-sm font-medium text-text-primary">
          <User size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
