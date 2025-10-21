/**
 * SelectionCard Component
 * 
 * Visual card component for selections in the posting wizard.
 * Used for type selection, urgency levels, and contact methods.
 * 
 * Features:
 * - Icon, title, and description display
 * - Selected state with ring border
 * - Color-coded variants for urgency levels
 * - Hover effects and transitions
 * - Keyboard accessible
 * - Mobile-responsive design
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  variant?: 'default' | 'urgency-low' | 'urgency-medium' | 'urgency-high' | 'urgency-critical';
  className?: string;
  disabled?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  icon,
  title,
  description,
  selected,
  onClick,
  variant = 'default',
  className,
  disabled = false
}) => {
  // Variant-specific styling
  const variantStyles = {
    'default': '',
    'urgency-low': selected 
      ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
      : 'hover:border-green-300',
    'urgency-medium': selected 
      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' 
      : 'hover:border-yellow-300',
    'urgency-high': selected 
      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' 
      : 'hover:border-orange-300',
    'urgency-critical': selected 
      ? 'border-red-500 bg-red-50 dark:bg-red-950/30' 
      : 'hover:border-red-300'
  };

  // Icon color based on variant
  const iconColorStyles = {
    'default': 'text-primary',
    'urgency-low': 'text-green-600 dark:text-green-400',
    'urgency-medium': 'text-yellow-600 dark:text-yellow-400',
    'urgency-high': 'text-orange-600 dark:text-orange-400',
    'urgency-critical': 'text-red-600 dark:text-red-400'
  };

  // Text color based on variant and selection
  const textColorStyles = {
    'default': '',
    'urgency-low': selected ? 'text-green-900 dark:text-green-100' : '',
    'urgency-medium': selected ? 'text-yellow-900 dark:text-yellow-100' : '',
    'urgency-high': selected ? 'text-orange-900 dark:text-orange-100' : '',
    'urgency-critical': selected ? 'text-red-900 dark:text-red-100' : ''
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onClick();
      }
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        selected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-md' 
          : 'hover:shadow-sm hover:border-primary/50',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <CardContent className="p-6 text-center">
        {/* Icon */}
        <div className={cn(
          "flex justify-center mb-3",
          iconColorStyles[variant]
        )}>
          {icon}
        </div>
        
        {/* Title */}
        <h3 className={cn(
          "font-semibold mb-1 text-sm sm:text-base",
          textColorStyles[variant]
        )}>
          {title}
        </h3>
        
        {/* Description */}
        <p className={cn(
          "text-xs sm:text-sm text-muted-foreground",
          textColorStyles[variant] && 'opacity-80'
        )}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

