import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap flex-shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border bg-transparent",
        // Grade variants using CSS variables from theme system
        "grade-a": "border-transparent bg-[var(--badge-grade-a)] text-[var(--badge-grade-a-foreground)] hover:bg-[var(--badge-grade-a)]/80",
        "grade-b": "border-transparent bg-[var(--badge-grade-b)] text-[var(--badge-grade-b-foreground)] hover:bg-[var(--badge-grade-b)]/80",
        "grade-c": "border-transparent bg-[var(--badge-grade-c)] text-[var(--badge-grade-c-foreground)] hover:bg-[var(--badge-grade-c)]/80",
        "grade-d": "border-transparent bg-[var(--badge-grade-d)] text-[var(--badge-grade-d-foreground)] hover:bg-[var(--badge-grade-d)]/80",
        "grade-f": "border-transparent bg-[var(--badge-grade-f)] text-[var(--badge-grade-f-foreground)] hover:bg-[var(--badge-grade-f)]/80",
        neutral: "border-transparent bg-[var(--badge-neutral)] text-[var(--badge-neutral-foreground)] hover:bg-[var(--badge-neutral)]/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'>,
    VariantProps<typeof badgeVariants> {
  // Enhanced Badge Props from old app analysis
  count?: number
  content?: React.ReactNode
  max?: number
  showZero?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  standalone?: boolean
}

// Badge Content Helper from old app patterns
const BadgeContent = ({ count, content, max, showZero }: Pick<BadgeProps, 'count' | 'content' | 'max' | 'showZero'>) => {
  if (content) {
    return content
  }

  if (count !== undefined) {
    if (count === 0 && !showZero) {
      return null
    }
    return count > (max || 99) ? `${max || 99}+` : count
  }

  return null
}

// Wrapper Badge Component (for positioning badges on other elements)
const BadgeWrapper = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
  position?: BadgeProps['position']
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {children}
    </div>
  )
}

function Badge({
  className,
  variant,
  size,
  count,
  content,
  max = 99,
  showZero = false,
  position = 'top-right',
  standalone = true,
  children,
  ...props
}: BadgeProps) {
  const badgeContentValue = BadgeContent({ count, content, max, showZero })

  // Determine what to display: badgeContentValue, children, or nothing
  const displayContent = badgeContentValue !== null ? badgeContentValue : children

  // If no content to show, return null
  if (displayContent === null || displayContent === undefined) {
    return null
  }

  const badgeElement = (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {displayContent}
    </div>
  )

  // If standalone or no positioning needed (when using children or simple content)
  if (standalone || (!count && !content)) {
    return badgeElement
  }

  // Positioned badge (for overlaying on other elements) - only for count/content badges
  const positionClasses = {
    'top-right': 'absolute -top-2 -right-2 z-10',
    'top-left': 'absolute -top-2 -left-2 z-10',
    'bottom-right': 'absolute -bottom-2 -right-2 z-10',
    'bottom-left': 'absolute -bottom-2 -left-2 z-10'
  }

  return (
    <div className={cn(badgeVariants({ variant, size }), positionClasses[position], className)} {...props}>
      {displayContent}
    </div>
  )
}

export { Badge, BadgeWrapper, badgeVariants }