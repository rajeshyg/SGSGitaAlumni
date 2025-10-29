import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Skeleton - Reusable loading placeholder component
 * Follows THEME_SYSTEM.md guidelines for theme-aware styling
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none'
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-muted",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
