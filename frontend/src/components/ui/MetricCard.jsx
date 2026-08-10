import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingDown } from 'lucide-react';

const MetricCard = ({ label, value, trend, trendIsGood, icon: Icon, variant = 'white' }) => {
  let bgClass = 'bg-surface';
  let iconClass = 'bg-surface-container-low text-text-secondary';
  
  if (variant === 'mint') {
    bgClass = 'bg-gradient-to-br from-gradient-mint-start to-gradient-mint-end';
    iconClass = 'bg-white/40 text-primary';
  } else if (variant === 'rose') {
    bgClass = 'bg-gradient-to-br from-gradient-rose-start to-gradient-rose-end';
    iconClass = 'bg-white/50 text-error-red';
  } else if (variant === 'blue') {
    bgClass = 'bg-gradient-to-br from-gradient-blue-start to-gradient-blue-end';
    iconClass = 'bg-white/50 text-info-blue';
  }

  return (
    <div className={`p-6 rounded-[24px] flex flex-col gap-4 shadow-sm ${bgClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-text-primary text-[11px] font-bold tracking-widest uppercase opacity-80">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconClass}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-text-primary text-display-lg leading-none">
          {value}
        </span>
        
        {trend && (
          <div 
            className={`flex items-center text-[13px] font-bold tracking-wide ${
              trendIsGood ? 'text-success-green' : 'text-error-red'
            }`}
          >
            {trendIsGood ? (
              <TrendingDown size={14} className="mr-1" />
            ) : (
              <ArrowDownRight size={14} className="mr-1" />
            )}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
