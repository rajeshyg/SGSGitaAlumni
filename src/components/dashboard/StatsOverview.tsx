// ============================================================================
// STATS OVERVIEW COMPONENT
// ============================================================================
// Dashboard statistics overview widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatsOverviewProps } from '../../types/dashboard';

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Connections',
      value: stats.totalConnections,
      icon: '👥',
      color: 'text-blue-600'
    },
    {
      label: 'Active Postings',
      value: stats.activePostings,
      icon: '📄',
      color: 'text-green-600'
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: '💬',
      color: 'text-orange-600'
    },
    {
      label: 'Profile Views',
      value: stats.profileViews,
      icon: '👁️',
      color: 'text-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className={`text-3xl font-bold ${item.color}`}>
                {item.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};