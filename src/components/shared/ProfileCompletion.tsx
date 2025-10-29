import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import Badge from '../ui/badge';
import { Button } from '../ui/button';

export interface ProfileCompletionProps {
  value: number;
  variant?: 'card' | 'tile' | 'compact';
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * ProfileCompletion
 * - card: full card with label, percent and progress bar (used in hero)
 * - tile: compact metric-like tile (used in stats grid)
 * - compact: tiny inline label (used in headers if needed)
 */
export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  value,
  variant = 'card',
  onAction,
  actionLabel = 'Complete profile'
}) => {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2"> 
        <span className="text-sm font-medium">{pct}%</span>
        <Progress value={pct} className="h-1 w-20" aria-label="Profile completion compact" />
      </div>
    );
  }

  if (variant === 'tile') {
    return (
      <div className="rounded-lg border p-3 transition-colors border-border/60 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile Completion</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{pct}%</p>
          </div>
          <div className="w-24">
            <Progress value={pct} aria-label="Profile completion" className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  // default to card
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Profile Completion</p>
            <p className="text-xl font-bold text-foreground">{pct}%</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {pct}%
          </Badge>
        </div>

        <div className="mt-3">
          <Progress value={pct} aria-label="Profile completion" className="h-2" />
        </div>

        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
