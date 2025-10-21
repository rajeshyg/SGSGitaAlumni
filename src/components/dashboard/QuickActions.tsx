// ============================================================================
// QUICK ACTIONS COMPONENT
// ============================================================================
// Quick action buttons widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { QuickActionsProps } from '../../types/dashboard';
import { Mail, Target, Users, SlidersHorizontal, UserCircle2 } from 'lucide-react';

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  inbox: Mail,
  target: Target,
  users: Users,
  'user-circle': UserCircle2,
  sliders: SlidersHorizontal
};

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">You're caught up. We'll surface actions here as soon as there's something to do.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {actions.map((action) => {
          const Icon = iconComponents[action.icon] ?? Target;

          return (
            <button
              key={action.id}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              onClick={() => { window.location.href = action.href; }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{action.description}</p>
                  </div>
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">{action.badge}</Badge>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};