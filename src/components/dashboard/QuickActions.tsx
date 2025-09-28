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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-14 sm:h-16 flex flex-col items-center justify-center space-y-1 p-2 touch-manipulation active:scale-95 transition-transform"
              onClick={action.action}
            >
              <span className="text-base sm:text-lg" role="img" aria-label={action.label}>
                {getIcon(action.icon)}
              </span>
              <span className="text-xs text-center leading-tight px-1">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};