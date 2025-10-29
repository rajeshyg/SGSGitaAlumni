import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { InsightCard } from './shared';
import { ActionCard } from '../shared/ActionCard';
import { DashboardPendingActionsProps } from '../../types/dashboard';
import ProfileCompletion from '../shared/ProfileCompletion';

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
        {actions.map((action) => {
          // Use unified ProfileCompletion for the profile-related action to avoid duplicate formats
          if (action.id === 'complete-profile' || /complete your profile/i.test(action.title)) {
            return (
              <ProfileCompletion
                key={action.id}
                value={action.progress}
                variant="card"
                onAction={() => { window.location.href = action.href; }}
              />
            );
          }

          return <ActionCard key={action.id} action={action} />;
        })}
      </CardContent>
    </Card>
  );
};
