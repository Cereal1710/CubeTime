import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  isPB?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  isPB = false,
  className = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-3 rounded-xl bg-surface border border-border/80 flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer hover:bg-surface-elevated hover:border-primary/40' : ''
      } ${isPB ? 'ring-1 ring-primary/40' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
          {label}
        </span>
        {isPB && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider animate-pulse">
            PB
          </span>
        )}
      </div>

      <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-text tabular-nums tracking-tight">
        {value}
      </div>

      {subtext && (
        <div className="mt-0.5 text-[11px] text-text-muted truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};

