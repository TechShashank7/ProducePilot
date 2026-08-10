import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from './Card';

const MetricCard = ({ label, value, trend, trendIsGood, icon: Icon }) => {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-[13px] uppercase tracking-wide font-medium">
          {label}
        </span>
        {Icon && <Icon size={18} className="text-text-muted" />}
      </div>
      
      <div className="flex items-end gap-3 mt-1">
        <span className="text-text-primary text-[28px] font-semibold leading-none">
          {value}
        </span>
        
        {trend && (
          <div 
            className={`flex items-center text-sm font-medium ${
              trendIsGood ? 'text-risk-low' : 'text-risk-high'
            }`}
          >
            {trend.startsWith('+') ? (
              <ArrowUpRight size={16} className="mr-0.5" />
            ) : (
              <ArrowDownRight size={16} className="mr-0.5" />
            )}
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MetricCard;
