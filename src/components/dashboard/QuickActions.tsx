// ============================================================================
// QUICK ACTIONS COMPONENT
// ============================================================================
// Quick action buttons widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { QuickActionsProps } from '../../types/dashboard';
import { Users, MessageSquare, Briefcase, UserPlus, Settings, PlusCircle, UsersRound, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Simplified member-focused quick actions (6-7 key actions in clean list format)
const getStaticActions = (isFamilyAccount: boolean, userRole?: string) => {
  const baseActions = [
    {
      id: 'create-posting',
      label: 'Create Posting',
      icon: PlusCircle,
      href: '/postings/new'
    },
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

  // Add family management for family accounts
  if (isFamilyAccount) {
    baseActions.splice(1, 0, {
      id: 'family',
      label: 'Manage Family',
      icon: UsersRound,
      href: '/family/manage'
    });
  }

  // Add moderation queue for moderators and admins
  const lowerCaseUserRole = userRole?.toLowerCase();
  if (lowerCaseUserRole === 'moderator' || lowerCaseUserRole === 'admin') {
    baseActions.splice(0, 0, {
      id: 'moderation',
      label: 'Moderation Queue',
      icon: Shield,
      href: '/moderator/queue'
    });
  }

  return baseActions;
};

export const QuickActions: React.FC<QuickActionsProps> = () => {
  const { user } = useAuth();
  const isFamilyAccount = user?.is_family_account === 1 || user?.is_family_account === true;
  const staticActions = getStaticActions(isFamilyAccount, user?.role);

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