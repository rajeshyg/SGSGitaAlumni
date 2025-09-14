import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Avatar size variants from old app patterns
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20"
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg"
      }
    },
    defaultVariants: {
      size: "md",
      shape: "circle"
    }
  }
)

// Helper to generate initials from name (from old app)
const getInitials = (name?: string) => {
  if (!name) return ''

  const nameParts = name.split(' ').filter(Boolean)
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase()
  }

  return (
    nameParts[0].charAt(0).toUpperCase() +
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  )
}

// Enhanced Avatar with old app features
interface EnhancedAvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  name?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  showStatus?: boolean
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  EnhancedAvatarProps
>(({ className, size, shape, src, alt, name, status, showStatus, ...props }, ref) => (
  <div className="relative inline-block">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, shape }), className)}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt || name}
          className="aspect-square h-full w-full"
        />
      )}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium">
        {name ? getInitials(name) : <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>

    {/* Status indicator */}
    {showStatus && status && (
      <span
        className={cn(
          "absolute -bottom-0 -right-0 block h-3 w-3 rounded-full border-2 border-background z-10",
          {
            "bg-green-500": status === 'online',
            "bg-muted-foreground": status === 'offline',
            "bg-yellow-500": status === 'away',
            "bg-red-500": status === 'busy'
          }
        )}
        data-testid="avatar-status"
      />
    )}
  </div>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// Keep original components for backward compatibility
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

// Enhanced AvatarFallback that automatically extracts initials from text content
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  // If children is a string that looks like initials (2-3 uppercase letters), use it
  // Otherwise, try to extract initials from the string
  let displayContent = children

  if (typeof children === 'string') {
    // If it's already formatted initials (like "DC", "JK"), use as-is
    if (/^[A-Z]{1,3}$/.test(children)) {
      displayContent = children
    } else {
      // Try to extract initials from full name
      displayContent = getInitials(children)
    }
  }

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium",
        className
      )}
      {...props}
    >
      {displayContent ? displayContent : <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }