// ============================================================================
// NOTIFICATIONS LIST COMPONENT
// ============================================================================
// User notifications widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { NotificationsListProps } from '../../types/dashboard';

export const NotificationsList: React.FC<NotificationsListProps> = ({ notifications }) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
      <CardContent className="pt-0">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
            No notifications
          </p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors active:bg-gray-100 touch-manipulation ${
                  !notification.isRead
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
                onClick={() => {
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm sm:text-base truncate ${
                      !notification.isRead ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-xs sm:text-sm mt-1 line-clamp-2 ${
                      !notification.isRead ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}

            {notifications.length > 5 && (
              <div className="text-center pt-2">
                <button
                  className="text-primary hover:text-primary/80 text-sm font-medium py-2 px-4 touch-manipulation"
                  onClick={() => {
                    window.location.href = '/notifications';
                  }}
                >
                  View All ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};