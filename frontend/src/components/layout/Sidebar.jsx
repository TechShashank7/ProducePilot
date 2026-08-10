import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Map, Bot, ChevronLeft, ChevronRight, Calculator, Wrench, Settings, LogOut, HelpCircle, Camera } from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'success'
  const fileInputRef = useRef(null);
  
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app' },
    { name: 'Check Freshness', icon: Camera, path: '/app/freshness' },
    { name: 'Inventory', icon: Package, path: '/app/inventory' },
    { name: 'Map', icon: Map, path: '/app/map' },
    { name: 'Agents', icon: Bot, path: '/app/agents' },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadStatus('success');
      // Reset the file input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setUploadStatus('idle');
  };

  return (
    <>
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
            <button 
              onClick={() => {
                setIsUploadModalOpen(true);
                setUploadStatus('idle');
              }}
              className="w-full bg-white text-primary font-semibold text-sm rounded-full py-2.5 mb-6 shadow-sm hover:bg-white/90 transition-colors"
            >
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

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              {uploadStatus === 'idle' ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Package size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Upload New Batch</h2>
                  </div>
                  <p className="text-gray-600 mb-6 text-sm">Please upload the CSV file containing the new batch data. This will update the inventory records.</p>
                  
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={handleCloseModal}
                      className="px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUploadClick}
                      className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      Upload CSV
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 border-4 border-green-50">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
                  <p className="text-gray-600 mb-8 text-sm">Dataset uploaded successfully. The new batch data has been processed.</p>
                  <button 
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm w-full text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
