import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import Badge from '../ui/badge';
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
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">You're all caught up for now. We'll notify you when something needs attention.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action) => (
          <div key={action.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{action.title}</h4>
                  <Badge variant={priorityVariant[action.priority] || 'secondary'}>
                    {priorityLabels[action.priority] || 'Action'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
              </div>
              <Button size="sm" onClick={() => { window.location.href = action.href; }}>
                Open
              </Button>
            </div>
            <div className="mt-3">
              <Progress value={action.progress} aria-label={`${action.title} progress`} />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{action.progress}% complete</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
