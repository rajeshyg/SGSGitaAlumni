import React from 'react';

export interface MetricTileProps {
  label: string;
  value: string | number;
  helperText?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const accentClassMap: Record<NonNullable<MetricTileProps['accent']>, string> = {
  default: 'border-border/60 bg-muted/30',
  success: 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-400/40 dark:bg-emerald-400/10',
  warning: 'border-amber-200/60 bg-amber-50/50 dark:border-amber-400/40 dark:bg-amber-400/10',
  danger: 'border-rose-200/60 bg-rose-50/50 dark:border-rose-400/40 dark:bg-rose-400/10',
  info: 'border-blue-200/60 bg-blue-50/50 dark:border-blue-400/40 dark:bg-blue-400/10'
};

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  helperText,
  accent = 'default'
}) => {
  const accentClasses = accentClassMap[accent];

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${accentClasses}`}
      role="article"
      aria-label={`${label}: ${value}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {helperText ? (
          <p className="text-xs text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  );
};
