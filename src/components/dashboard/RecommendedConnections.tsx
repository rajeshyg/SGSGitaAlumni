import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ConnectionCard } from '../shared/ConnectionCard';
import { RecommendedConnectionsProps } from '../../types/dashboard';

export const RecommendedConnections: React.FC<RecommendedConnectionsProps> = ({ connections }) => {
  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Check back soon for new alumni connections that match your interests.</p>
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
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </CardContent>
    </Card>
  );
};
