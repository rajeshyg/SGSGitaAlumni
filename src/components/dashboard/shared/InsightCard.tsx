import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import Badge from '../../ui/badge';
import { Button } from '../../ui/button';
import { LucideIcon } from 'lucide-react';

export interface InsightAction {
  label: string;
  href: string;
}

export interface InsightCardProps {
  title: string;
  description: string;
  severity?: 'info' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
  badgeText?: string;
  actions?: InsightAction[];
}

const severityClassMap: Record<NonNullable<InsightCardProps['severity']>, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-50',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-50',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-50',
  danger: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-50'
};

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  severity = 'info',
  icon: Icon,
  badgeText,
  actions
}) => {
  const severityClasses = severityClassMap[severity];

  return (
    <Card className={`${severityClasses} shadow-sm transition`}> 
      <CardHeader className="flex flex-row items-start gap-3 pb-3">
        {Icon ? (
          <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-current dark:bg-background/40">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold leading-snug">
              {title}
            </CardTitle>
            {badgeText ? (
              <Badge variant="secondary" className="text-[10px] leading-tight">
                {badgeText}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-current/90 leading-relaxed">
            {description}
          </p>
        </div>
      </CardHeader>
      {actions && actions.length > 0 ? (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = action.href;
                }}
                className="border-current/40 text-current"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};
