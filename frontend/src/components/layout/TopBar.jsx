import React, { useState } from 'react';
import { Search, ChevronDown, Bell, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWarehouse } from '../../context/WarehouseContext';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import { useToast } from '../ui/Toast';

const TopBar = () => {
  const { warehouses, selectedWarehouseId, setSelectedWarehouseId, loading } = useWarehouse();
  const { userRole, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const showSearch = location.pathname === '/' || location.pathname === '/inventory';
  
  const selectedWarehouse = warehouses.find(w => w._id === selectedWarehouseId);
  const displayName = loading ? 'Loading...' : (selectedWarehouse?.name || 'NCR Central Hub');

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const data = await fetchApi(`/batches?warehouseId=${selectedWarehouseId || 'all'}&batchCode=${searchQuery.trim()}`);
        if (data.batches && data.batches.length > 0) {
          navigate(`/app/batches/${data.batches[0]._id}`);
          setSearchQuery('');
        } else {
          toast.error("No batch found with that code.");
        }
      } catch (err) {
        toast.error("Failed to search batches.");
      }
    }
  };

  const handleBellClick = () => {
    toast.success("No new notifications at the moment!");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 sticky top-0 z-10 bg-transparent mb-4">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <button className={`flex items-center gap-2 text-text-primary bg-surface px-4 py-2 rounded-full border border-border-light shadow-sm transition-colors ${userRole !== 'worker' ? 'hover:border-outline-variant cursor-pointer' : 'cursor-default'}`}>
            <span className="font-medium text-sm">{displayName}</span>
            {userRole !== 'worker' && <ChevronDown size={16} className="text-text-secondary" />}
          </button>
          
          {!loading && userRole !== 'worker' && warehouses.length > 0 && (
            <div className="absolute left-0 top-full pt-2 w-56 hidden group-hover:block z-50">
              <div className="bg-surface border border-border-light rounded-xl shadow-lg py-1 overflow-hidden">
                {warehouses.map(w => (
                  <button
                    key={w._id}
                    onClick={() => setSelectedWarehouseId(w._id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-dim transition-colors ${selectedWarehouseId === w._id ? 'text-primary font-medium' : 'text-text-primary'}`}
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
        {showSearch && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-text-secondary" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search batch (e.g. B-2026-0136)..."
              className="bg-surface border border-border-light text-text-primary text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-primary w-64 shadow-sm transition-colors placeholder:text-text-muted"
            />
          </div>
        )}

        <button 
          onClick={handleBellClick}
          className="relative w-10 h-10 bg-surface rounded-full border border-border-light shadow-sm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error-red rounded-full border border-surface"></span>
        </button>

        <button 
          onClick={handleLogout}
          title="Log Out"
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white hover:bg-error-red transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
