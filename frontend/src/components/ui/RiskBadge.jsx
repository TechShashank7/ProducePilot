import React from 'react';

const RiskBadge = ({ riskPct, category }) => {
  // Determine color based on riskPct
  let colorClass = 'text-risk-low bg-risk-lowBg border-risk-low/20';
  if (riskPct >= 75) {
    colorClass = 'text-risk-critical bg-risk-criticalBg border-risk-critical/20';
  } else if (riskPct >= 50) {
    colorClass = 'text-risk-high bg-risk-highBg border-risk-high/20';
  } else if (riskPct >= 25) {
    colorClass = 'text-risk-medium bg-risk-mediumBg border-risk-medium/20';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {category} · {riskPct}%
    </span>
  );
};

export default RiskBadge;
