import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import Badge from '../ui/badge';
import { RecommendedConnectionsProps } from '../../types/dashboard';

const formatInitials = (value: string) => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'A';
};

export const RecommendedConnections: React.FC<RecommendedConnectionsProps> = ({ connections }) => {
  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Check back soon for new alumni connections that match your interests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Connections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.map((connection) => (
          <div key={connection.id} className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={connection.avatarUrl ?? undefined} alt={connection.fullName} />
              <AvatarFallback>{formatInitials(connection.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {connection.fullName || 'Alumni Member'}
                </h4>
                {connection.sharedAttributes?.map((attribute) => (
                  <Badge key={attribute} variant="secondary" className="text-xs">
                    {attribute}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {[connection.position, connection.company].filter(Boolean).join(' - ') || 'Add your latest role'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {connection.location || 'Location unavailable'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { window.location.href = '/alumni-directory'; }}>
              View
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
