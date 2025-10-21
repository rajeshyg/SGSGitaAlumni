import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import Badge from '../ui/badge';
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
  const lastLogin = formatDate(summary.lastLoginAt);
  const missingFields = summary.missingProfileFields.slice(0, 3);

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/5 dark:to-transparent">
      <div className="absolute inset-y-0 right-0 w-48 bg-primary/10 blur-3xl dark:bg-primary/20" aria-hidden="true" />
      <CardHeader className="z-10">
        <CardTitle className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {summary.greeting}, {summary.firstName || summary.fullName}!
        </CardTitle>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl">
          Here's a quick snapshot of your alumni network activity and profile health.
        </p>
      </CardHeader>
      <CardContent className="z-10 grid gap-4 sm:gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Profile completion</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.profileCompletion}%</span>
              {summary.profileCompletion >= 90 ? (
                <Badge>Great job</Badge>
              ) : (
                <Badge variant="secondary">Let's finish it</Badge>
              )}
            </div>
          </div>
          <Progress value={summary.profileCompletion} aria-label="Profile completion progress" />
          {missingFields.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Missing details: {missingFields.join(', ')}
              {summary.missingProfileFields.length > 3 ? '...' : ''}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Current role</p>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {summary.currentPosition || 'Add your current role'}
            </p>
            {summary.company && (
              <p className="text-sm text-gray-600 dark:text-gray-300">{summary.company}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Primary domain</p>
            {summary.primaryDomain ? (
              <Badge variant="outline" className="mt-1">
                {summary.primaryDomain.name}
              </Badge>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Set your primary domain to get tailored opportunities.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Location</p>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {summary.location || 'Add your location'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Member since</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{memberSince || 'Just joined'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Last active</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{lastLogin || 'Active now'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
