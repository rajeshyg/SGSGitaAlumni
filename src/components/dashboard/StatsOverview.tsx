// ============================================================================
// STATS OVERVIEW COMPONENT
// ============================================================================
// Dashboard statistics overview widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatsOverviewProps } from '../../types/dashboard';

const formatValue = (value: number) => {
  return value.toLocaleString();
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Your network',
      value: formatValue(stats.networkSize),
      helper: 'active alumni connections'
    },
    {
      label: 'Active opportunities',
      value: formatValue(stats.activeOpportunities),
      helper: 'currently available'
    },
    {
      label: 'Matched for you',
      value: formatValue(stats.matchedOpportunities),
      helper: 'align with your domains'
    },
    {
      label: 'Pending invitations',
      value: formatValue(stats.pendingInvitations),
      helper: 'need your response'
    },
    {
      label: 'Profile completion',
      value: `${stats.profileCompletion}%`,
      helper: 'setup progress'
    },
    {
      label: 'Invitations sent',
      value: formatValue(stats.invitationsSent),
      helper: 'you have shared'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Dashboard Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.helper}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};