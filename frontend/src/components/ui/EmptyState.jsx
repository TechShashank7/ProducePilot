import React from 'react';
import Card from './Card';

const EmptyState = ({ icon: Icon, message, action }) => {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-muted" />
        </div>
      )}
      <p className="text-text-secondary mb-4 max-w-sm">{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </Card>
  );
};

export default EmptyState;
