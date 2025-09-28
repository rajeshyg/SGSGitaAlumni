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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Dashboard Overview</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="text-center p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-xl sm:text-2xl mb-1 sm:mb-2" role="img" aria-label={item.label}>
                {item.icon}
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${item.color} leading-none`}>
                {item.value.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};