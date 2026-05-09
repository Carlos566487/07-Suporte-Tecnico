import React from 'react';

interface StatCardProps {
  title: string;
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
  value: string;
  trendValue?: string;
  trendIcon?: string;
  trendColorClass?: string;
}

export function StatCard({ 
  title, 
  icon, 
  iconColorClass, 
  iconBgClass, 
  value, 
  trendValue, 
  trendIcon, 
  trendColorClass 
}: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{title}</p>
        <span className={`material-symbols-outlined ${iconColorClass} ${iconBgClass} p-1 rounded`}>{icon}</span>
      </div>
      <div className="flex items-end gap-3">
        <h3 className="font-display-lg text-display-lg text-on-surface">{value}</h3>
        {trendValue && (
          <span className={`font-label-bold text-label-bold ${trendColorClass} flex items-center mb-1`}>
            {trendIcon && <span className="material-symbols-outlined text-[16px]">{trendIcon}</span>}
            {trendIcon ? " " : ""}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
