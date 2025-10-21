import * as React from "react"
import { cn } from "../../lib"
import { badgeVariants, type BadgeVariantProps } from "./badge-utils"

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'>,
    BadgeVariantProps {
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

export { Badge, BadgeWrapper }
export default Badge