import React from 'react';

const RiskBadge = ({ riskPct, category }) => {
  // Determine color based on riskPct
  let colorClass = 'text-success-green bg-gradient-mint-start border-success-green/20';
  if (riskPct >= 75) {
    colorClass = 'text-error-red bg-error-container border-error-red/20';
  } else if (riskPct >= 50) {
    colorClass = 'text-warning-orange bg-warning-orange/10 border-warning-orange/20';
  } else if (riskPct >= 25) {
    colorClass = 'text-warning-orange bg-warning-orange/10 border-warning-orange/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-pill ${colorClass}`}>
      {category} · {riskPct}%
    </span>
  );
};

export default RiskBadge;
