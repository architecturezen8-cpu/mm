'use client';

import { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  className?: string;
  children: ReactNode;
}

export default function ChartWrapper({ title, className = '', children }: ChartWrapperProps) {
  return (
    <div className={`bg-lux-card border border-lux-border p-4 sm:p-5 lg:p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-gold" />
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-text-secondary">{title}</h3>
      </div>
      <div className="relative" style={{ height: '280px' }}>
        {children}
      </div>
    </div>
  );
}
