import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { ActivityTimelineProps } from '../../types/dashboard';

const formatTimestamp = (value: string | Date | null | undefined) => {
  if (!value) {
    return 'Recently';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Once you start engaging with the community, your activity will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="relative pl-6">
              <div className="absolute left-1 top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {item.title || item.type}
                </h4>
                <Badge variant="outline" className="text-xs capitalize">
                  {item.type}
                </Badge>
              </div>
              {item.content && (
                <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {item.actor && <span className="font-medium text-foreground">{item.actor}</span>}
                {item.actor ? ' - ' : ''}
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
