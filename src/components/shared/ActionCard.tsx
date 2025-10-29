/**
 * ActionCard - Reusable component for displaying pending actions
 * Ensures consistent styling and proper layout without overlapping content
 * Follows theme standards and mobile-first responsive design
 */

import React from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import Badge from '../ui/badge';
import { cn } from '../../lib/utils';

export interface ActionData {
  id: string;
  title: string;
  description: string;
  progress: number;
  href: string;
  priority: 'high' | 'medium' | 'low' | 'secondary';
  dueDate?: string;
  category?: string;
}

export interface ActionCardProps {
  action: ActionData;
  onAction?: (actionId: string) => void;
  className?: string;
}

const priorityConfig: Record<ActionData['priority'], {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
  color: string;
}> = {
  high: {
    label: 'High Priority',
    variant: 'destructive',
    color: 'text-destructive'
  },
  medium: {
    label: 'Medium Priority',
    variant: 'default',
    color: 'text-primary'
  },
  low: {
    label: 'Low Priority',
    variant: 'secondary',
    color: 'text-muted-foreground'
  },
  secondary: {
    label: 'Optional',
    variant: 'secondary',
    color: 'text-muted-foreground'
  }
};

/**
 * ActionCard component with proper layout and no overlapping
 */
export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  onAction,
  className
}) => {
  const config = priorityConfig[action.priority] || priorityConfig.medium;

  const handleAction = () => {
    if (onAction) {
      onAction(action.id);
    } else {
      // Default navigation
      window.location.href = action.href;
    }
  };

  return (
    <div 
      className={cn(
        'rounded-lg border border-border/60 bg-card/80 p-4 transition-all hover:border-border hover:bg-card',
        className
      )}
    >
      {/* Mobile-first layout: Stack on mobile, row on larger screens */}
      <div className="space-y-4">
        {/* Header section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Title and description */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title with priority badge */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h4 className="text-base font-semibold text-foreground break-words leading-tight">
                {action.title}
              </h4>
              <Badge 
                variant={config.variant} 
                className="w-fit text-xs px-2 py-0.5"
              >
                {config.label}
              </Badge>
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {action.description}
            </p>

            {/* Optional metadata */}
            {(action.category || action.dueDate) && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {action.category && (
                  <span className="flex items-center gap-1">
                    📁 {action.category}
                  </span>
                )}
                {action.dueDate && (
                  <span className="flex items-center gap-1">
                    📅 Due: {new Date(action.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action button - full width on mobile, auto on larger screens */}
          <Button 
            size="sm" 
            onClick={handleAction}
            className="w-full sm:w-auto shrink-0 min-h-[40px]"
          >
            Open
          </Button>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <Progress 
            value={action.progress} 
            aria-label={`${action.title} progress`}
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {action.progress}% complete
            </span>
            {action.progress === 100 && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ Complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCard;

