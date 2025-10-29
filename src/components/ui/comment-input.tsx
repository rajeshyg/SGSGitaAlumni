import * as React from "react"
import { Button } from "./button"
import { cn } from "../../lib/utils"

/**
 * CommentInput - Reusable comment input component
 * Follows COMPONENT_PATTERNS.md for consistent user input patterns
 */
interface CommentInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  placeholder?: string
  isSubmitting?: boolean
  className?: string
  minRows?: number
}

const CommentInput = React.forwardRef<HTMLTextAreaElement, CommentInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onCancel,
      placeholder = "Write a comment...",
      isSubmitting = false,
      className,
      minRows = 3
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && value.trim() && !isSubmitting) {
        e.preventDefault()
        onSubmit()
      }
      // Cancel on Escape
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    return (
      <div className={cn("space-y-3 border-t pt-3", className)}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          rows={minRows}
          className="w-full min-h-[80px] p-3 text-sm border border-input rounded-md resize-none 
                   bg-background text-foreground placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                   disabled:cursor-not-allowed disabled:opacity-50
                   transition-colors"
          aria-label="Comment text"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Press Ctrl+Enter to submit
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={!value.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
)
CommentInput.displayName = "CommentInput"

export { CommentInput }
