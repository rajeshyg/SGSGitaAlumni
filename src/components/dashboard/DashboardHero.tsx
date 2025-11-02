import React from 'react';
import { Card, CardContent } from '../ui/card';
import ProfileCompletion from '../shared/ProfileCompletion';
import { DashboardHeroProps } from '../../types/dashboard';

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const DashboardHero: React.FC<DashboardHeroProps> = ({ summary }) => {
  const memberSince = formatDate(summary.memberSince);

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Compact Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">
            {summary.greeting}, {summary.firstName || summary.fullName}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's a quick snapshot of your alumni network activity and profile health.
          </p>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Profile Completion */}
          <ProfileCompletion value={summary.profileCompletion} variant="tile" onAction={() => { window.location.href = '/profile/edit'; }} />

          {/* Current Role */}
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Current Role</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {summary.currentPosition || 'Add role'}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">💼</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {summary.location || 'Add location'}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">📍</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Since */}
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-bold text-foreground truncate">
                    {memberSince || 'Just joined'}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">⭐</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
