import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const info = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  let Icon = Info;
  let bgClass = 'bg-bg-elevated border-border';
  let iconClass = 'text-accent';

  if (toast.type === 'success') {
    Icon = CheckCircle;
    bgClass = 'bg-bg-elevated border-accent-muted';
    iconClass = 'text-accent';
  } else if (toast.type === 'error') {
    Icon = AlertCircle;
    bgClass = 'bg-risk-criticalBg border-risk-critical';
    iconClass = 'text-risk-critical';
  }

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 w-80 rounded-lg shadow-lg border ${bgClass} transition-all duration-300`}>
      <Icon size={20} className={`shrink-0 mt-0.5 ${iconClass}`} />
      <div className="flex-1 text-sm text-text-primary">
        {toast.message}
      </div>
      <button 
        onClick={onRemove}
        className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
