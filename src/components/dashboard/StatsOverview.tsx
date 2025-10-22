// ============================================================================
// STATS OVERVIEW COMPONENT
// ============================================================================
// Dashboard statistics overview widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MetricTile } from './shared';
import { StatsOverviewProps } from '../../types/dashboard';

const formatValue = (value: number) => {
  return value.toLocaleString();
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Your Network',
      value: formatValue(stats.networkSize),
      helper: 'Active alumni connections',
      accent: 'info' as const
    },
    {
      label: 'Active Opportunities',
      value: formatValue(stats.activeOpportunities),
      helper: 'Currently available to you',
      accent: 'success' as const
    },
    {
      label: 'Matched For You',
      value: formatValue(stats.matchedOpportunities),
      helper: 'Align with your domains',
      accent: 'info' as const
    },
    {
      label: 'Pending Invitations',
      value: formatValue(stats.pendingInvitations),
      helper: 'Need your response',
      accent: 'warning' as const
    },
    {
      label: 'Profile Completion',
      value: `${stats.profileCompletion}%`,
      helper: 'Setup progress',
      accent: 'success' as const
    },
    {
      label: 'Invitations Sent',
      value: formatValue(stats.invitationsSent),
      helper: 'Shared with your network',
      accent: 'default' as const
    }
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 sm:pb-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          Dashboard Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          {statItems.map((item) => (
            <MetricTile
              key={item.label}
              label={item.label}
              value={item.value}
              helperText={item.helper}
              accent={item.accent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};