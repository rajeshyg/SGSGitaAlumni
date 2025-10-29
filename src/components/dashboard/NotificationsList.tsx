// ============================================================================
// NOTIFICATIONS LIST COMPONENT
// ============================================================================
// User notifications widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { NotificationsListProps } from '../../types/dashboard';
import ProfileCompletion from '../shared/ProfileCompletion';

const levelClasses: Record<string, string> = {
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-400/40 dark:bg-amber-400/10',
  success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-400/10',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-400/40 dark:bg-blue-400/10'
};

const formatTimestamp = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, profileCompletion }) => {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No notifications right now. We'll let you know when something changes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs px-2 py-1">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2 sm:space-y-3">
        {notifications.slice(0, 5).map((notification) => {
          const levelClass = levelClasses[notification.level] || 'border-border/60 bg-muted/30';

          // If this notification is the profile completion prompt, render the compact profile widget
          if (/complete your profile/i.test(notification.title)) {
            return (
              <div key={notification.id} className={levelClass + ' p-3 rounded-lg'}>
                <ProfileCompletion
                  value={profileCompletion ?? 0}
                  variant="compact"
                  onAction={() => { if (notification.actionHref) { window.location.href = notification.actionHref; } else { window.location.href = '/preferences'; } }}
                />
              </div>
            );
          }

          return (
            <button type="button"
              key={notification.id}
              className={`w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 ${levelClass}`}
              onClick={() => {
                if (notification.actionHref) {
                  window.location.href = notification.actionHref;
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm sm:text-base truncate ${notification.isRead ? 'text-foreground' : 'text-foreground'}`}>
                    {notification.title}
                  </h4>
                  <p className="text-xs sm:text-sm mt-1 line-clamp-2 text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </div>
            </button>
          );
        })}

        {notifications.length > 5 && (
          <div className="text-center pt-2">
            <button type="button"
              className="text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => {
                window.location.href = '/notifications';
              }}
            >
              View all ({notifications.length})
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};