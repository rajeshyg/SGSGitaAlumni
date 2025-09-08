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
  count?: number
  content?: React.ReactNode
  max?: number
  showZero?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  standalone?: boolean
}

function getBadgeContent({ count, content, max, showZero }: Pick<BadgeProps, 'count' | 'content' | 'max' | 'showZero'>) {
  if (content) return content
  if (count !== undefined) {
    if (count === 0 && !showZero) return null
    return count > (max || 99) ? `${max || 99}+` : count
  }
  return null
}

function getPositionClasses(position: BadgeProps['position']) {
  const classes = {
    'top-right': 'absolute -top-2 -right-2 z-10',
    'top-left': 'absolute -top-2 -left-2 z-10',
    'bottom-right': 'absolute -bottom-2 -right-2 z-10',
    'bottom-left': 'absolute -bottom-2 -left-2 z-10'
  }
  return classes[position || 'top-right']
}

function shouldUsePositioning({ standalone, count, content }: Pick<BadgeProps, 'standalone' | 'count' | 'content'>) {
  return !standalone && !!(count || content)
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
  const badgeContent = getBadgeContent({ count, content, max, showZero })
  const displayContent = badgeContent !== null ? badgeContent : children

  if (displayContent === null || displayContent === undefined) {
    return null
  }

  const baseClasses = badgeVariants({ variant, size })
  const finalClasses = shouldUsePositioning({ standalone, count, content })
    ? cn(baseClasses, getPositionClasses(position), className)
    : cn(baseClasses, className)

  return (
    <div className={finalClasses} {...props}>
      {displayContent}
    </div>
  )
}

function BadgeWrapper({
  children,
  className,
  ...props
}: {
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {children}
    </div>
  )
}

export { BadgeWrapper, badgeVariants }
export default Badge