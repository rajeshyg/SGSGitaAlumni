import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import Badge from '../ui/badge';
import { InsightCard } from './shared';
import { DashboardPendingActionsProps } from '../../types/dashboard';

const priorityLabels: Record<string, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
  secondary: 'Secondary'
};

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
  secondary: 'secondary'
};

export const PendingActions: React.FC<DashboardPendingActionsProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <InsightCard
        title="Next Steps"
        description="You're all caught up for now. We'll notify you when something needs attention."
        severity="success"
      />
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 sm:pb-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div key={action.id} className="space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-foreground">
                    {action.title}
                  </h4>
                  <Badge variant={priorityVariant[action.priority] || 'secondary'}>
                    {priorityLabels[action.priority] || 'Action'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
              <Button size="sm" onClick={() => { window.location.href = action.href; }}>
                Open
              </Button>
            </div>
            <div>
              <Progress value={action.progress} aria-label={`${action.title} progress`} />
              <p className="mt-2 text-xs text-muted-foreground">
                {action.progress}% complete
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
