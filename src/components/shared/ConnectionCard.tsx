/**
 * ConnectionCard - Reusable component for displaying connection recommendations
 * Ensures consistent styling and proper layout without overlapping content
 * Follows theme standards and mobile-first responsive design
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import Badge from '../ui/badge';
import { cn } from '../../lib/utils';

export interface ConnectionData {
  id: string | number;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  position?: string | null;
  company?: string | null;
  location?: string | null;
  sharedAttributes?: string[];
  matchScore?: number;
}

export interface ConnectionCardProps {
  connection: ConnectionData;
  onView?: (connectionId: string | number) => void;
  onConnect?: (connectionId: string | number) => void;
  showSharedAttributes?: boolean;
  className?: string;
}

const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'A';
};

/**
 * ConnectionCard component with proper layout and no overlapping
 */
export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onView,
  onConnect,
  showSharedAttributes = true,
  className
}) => {
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(connection.id);
    } else {
      // Default navigation
      window.location.href = `/alumni/${connection.id}`;
    }
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnect) {
      onConnect(connection.id);
    }
  };

  return (
    <div 
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/30 hover:border-border/80',
        className
      )}
    >
      {/* Mobile-first layout: Stack on mobile, row on larger screens */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        <Avatar className="h-14 w-14 shrink-0 self-start">
          <AvatarImage 
            src={connection.avatarUrl ?? undefined} 
            alt={connection.fullName} 
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {formatInitials(connection.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Content - takes remaining space */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Name and shared attributes */}
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-foreground break-words leading-tight">
              {connection.fullName || 'Alumni Member'}
            </h4>
            
            {showSharedAttributes && connection.sharedAttributes && connection.sharedAttributes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {connection.sharedAttributes.map((attribute) => (
                  <Badge 
                    key={attribute} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5"
                  >
                    {attribute}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Position and company */}
          {(connection.position || connection.company) && (
            <p className="text-sm text-foreground break-words leading-relaxed">
              {[connection.position, connection.company].filter(Boolean).join(' at ') || 'Add your latest role'}
            </p>
          )}

          {/* Location */}
          {connection.location && (
            <p className="text-xs text-muted-foreground break-words">
              📍 {connection.location}
            </p>
          )}

          {/* Action buttons - full width on mobile, auto on larger screens */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleView}
              className="flex-1 sm:flex-initial min-h-[40px]"
            >
              View Profile
            </Button>
            {onConnect && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleConnect}
                className="flex-1 sm:flex-initial min-h-[40px]"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;

