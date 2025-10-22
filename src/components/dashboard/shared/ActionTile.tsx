import React from 'react';
import Badge from '../../ui/badge';
import { LucideIcon } from 'lucide-react';

export interface ActionTileProps {
  label: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const ActionTile: React.FC<ActionTileProps> = ({
  label,
  description,
  href,
  icon: Icon,
  badgeText,
  badgeVariant = 'secondary'
}) => {
  return (
    <a
      href={href}
      className="group block rounded-lg border border-border/60 bg-background p-4 shadow-sm transition-all hover:border-border hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground/90">
              {label}
            </h3>
            {badgeText ? (
              <Badge variant={badgeVariant} className="text-[10px] leading-tight">
                {badgeText}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
};
