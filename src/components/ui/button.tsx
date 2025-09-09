import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants, type ButtonVariantProps } from "./button-utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function renderLoadingState(loadingText?: string, children?: React.ReactNode) {
  return (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      {loadingText || children}
    </>
  )
}

function renderContentWithIcons(leftIcon?: React.ReactNode, children?: React.ReactNode, rightIcon?: React.ReactNode) {
  return (
    <>
      {leftIcon && <span className="inline-flex">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex">{rightIcon}</span>}
    </>
  )
}

function renderAsChildButton({
  Comp,
  className,
  variant,
  size,
  ref,
  disabled,
  loading,
  props,
  children
}: {
  Comp: React.ElementType
  className?: string
  variant?: ButtonVariantProps['variant']
  size?: ButtonVariantProps['size']
  ref: React.Ref<HTMLButtonElement>
  disabled?: boolean
  loading?: boolean
  props: React.HTMLAttributes<HTMLButtonElement>
  children: React.ReactNode
}) {
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Comp>
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonClasses = cn(buttonVariants({ variant, size }), className)
    const isDisabled = disabled || loading

    if (asChild) {
      return renderAsChildButton({
        Comp,
        className,
        variant,
        size,
        ref,
        disabled,
        loading,
        props,
        children
      })
    }

    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading
          ? renderLoadingState(loadingText, children)
          : renderContentWithIcons(leftIcon, children, rightIcon)
        }
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button }