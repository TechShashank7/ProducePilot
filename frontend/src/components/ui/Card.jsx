import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-bg-surface border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
