// Core Components
export { default as Badge } from './badge'
export { badgeVariants, type BadgeVariantProps } from './badge-utils'
export { Button } from './button'
export { buttonVariants, type ButtonVariantProps } from './button-utils'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'
export { Alert, AlertTitle, AlertDescription } from './alert'
export { Input } from './input'
export { Label } from './label'
export { Textarea } from './textarea'
export { Checkbox } from './checkbox'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'

// Layout & Navigation
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger
} from './dropdown-menu'

// Data Display
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from './table'
export { TanStackAdvancedTable } from './tanstack-advanced-table'

// Navigation
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { ScrollArea, ScrollBar } from './scroll-area'
export { Progress } from './progress'
export { Separator } from './separator'

// Advanced Components
// Domain-specific components removed per Phase 1 correction
// RoleBadge, StatusBadge, InventoryBadge removed - not reusable