import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { DomainFocusCardProps } from '../../types/dashboard';

export const DomainFocusCard: React.FC<DomainFocusCardProps> = ({ focus }) => {
  if (!focus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select your primary and secondary domains in preferences to receive more relevant matches.
          </p>
          <button type="button"
            onClick={() => { window.location.href = '/preferences'; }}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Update preferences
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Domain Focus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <h4 className="text-sm font-semibold text-muted-foreground">Primary domain</h4>
          {focus.primary ? (
            <Badge variant="outline" className="mt-2">
              {focus.primary.name}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Set a primary domain to personalise your dashboard.</p>
          )}
        </section>

        <section>
          <h4 className="text-sm font-semibold text-muted-foreground">Secondary domains</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {focus.secondary.length > 0 ? (
              focus.secondary.map((domain) => (
                <Badge key={domain.id} variant="secondary" className="text-xs">
                  {domain.name}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Add secondary domains to broaden your matches.</p>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-muted-foreground">Interests</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {focus.interests.length > 0 ? (
              focus.interests.map((domain) => (
                <Badge key={domain.id} variant="outline" className="text-xs">
                  {domain.name}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Pick a few interests to help us recommend opportunities.</p>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
};
