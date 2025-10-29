import * as React from "react"
import { Card } from "./card"
import { cn } from "../../lib/utils"

/**
 * EmptyState - Reusable empty state component
 * Follows COMPONENT_PATTERNS.md for consistent empty states
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className }, ref) => {
    return (
      <Card ref={ref} className={cn("p-12", className)}>
        <div className="text-center space-y-3">
          {icon && (
            <div className="flex justify-center text-muted-foreground">
              {icon}
            </div>
          )}
          <div>
            <p className="text-lg font-medium text-foreground mb-2">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="pt-2">{action}</div>}
        </div>
      </Card>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
