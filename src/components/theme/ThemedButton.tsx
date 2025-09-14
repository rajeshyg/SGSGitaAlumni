import * as React from "react"
import { Button } from "../ui/button"
import { cn } from "lib/utils"

interface ThemedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  className?: string
}

export function ThemedButton({ children, className, ...props }: ThemedButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}