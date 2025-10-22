// ============================================================================
// QUICK ACTIONS COMPONENT
// ============================================================================
// Quick action buttons widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { QuickActionsProps } from '../../types/dashboard';
import { Users, MessageSquare, Briefcase, UserPlus, Settings } from 'lucide-react';

// Simplified member-focused quick actions (5 key actions in clean list format)
const staticActions = [
  {
    id: 'directory',
    label: 'Browse Directory',
    icon: Users,
    href: '/alumni-directory'
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    href: '/chat'
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: Briefcase,
    href: '/postings'
  },
  {
    id: 'connections',
    label: 'My Connections',
    icon: UserPlus,
    href: '/connections'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/preferences'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = () => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {staticActions.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors group"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1">{action.label}</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};