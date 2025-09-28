// ============================================================================
// QUICK ACTIONS COMPONENT
// ============================================================================
// Quick action buttons widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { QuickActionsProps } from '../../types/dashboard';

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const getIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      plus: '➕',
      search: '🔍',
      message: '💬',
      user: '👤'
    };
    return icons[iconName] || '⚡';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-1 p-2"
              onClick={action.action}
            >
              <span className="text-lg">{getIcon(action.icon)}</span>
              <span className="text-xs text-center leading-tight">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};