import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import {
  Bell,
  MessageSquare,
  Search,
  LogOut,
  UserPlus,
  Menu
} from 'lucide-react'
// Note: ThemeToggle component will be imported once theme system is fully set up

interface UserProfile {
  id: string | number
  name: string
  role: string
  avatar?: string
  preferences?: {
    professionalStatus?: string
  }
}

interface DashboardHeaderProps {
  currentProfile: UserProfile
  stats: {
    notifications: { unread: number }
    chat: { totalUnread: number }
  }
  onSwitchProfile: () => void
  onLogout: () => void
}

export function DashboardHeader({ currentProfile, stats, onSwitchProfile, onLogout }: DashboardHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img
              src="/images/opportunities/sgsgf-logo.png"
              alt="SGS Gita Foundation Logo"
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold">SGSGita Alumni System</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Alumni Management Platform</p>
            </div>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-2">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Quick Search */}
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => navigate('/alumni-directory')}
              >
                <Search className="h-4 w-4 mr-2" />
                Search alumni...
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/responses')}
              >
                <Bell className="h-5 w-5" />
                {stats.notifications.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {stats.notifications.unread}
                  </span>
                )}
              </Button>

              {/* Messages */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="h-5 w-5" />
                {stats.chat.totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {stats.chat.totalUnread}
                  </span>
                )}
              </Button>

              {/* Theme Toggle - Placeholder for now */}
              <div className="w-10 h-10" /> {/* Placeholder for theme toggle */}

              <Separator orientation="vertical" className="h-6" />
            </div>

            {/* Mobile Menu Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/alumni-directory')}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Alumni
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/responses')}>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    {stats.notifications.unread > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                        {stats.notifications.unread}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/chat')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                    {stats.chat.totalUnread > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
                        {stats.chat.totalUnread}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSwitchProfile}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Switch Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Section */}
            <div className="flex items-center space-x-2">
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium">{currentProfile.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentProfile.preferences?.professionalStatus || 'member'} • {currentProfile.role}</p>
              </div>
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={currentProfile.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {currentProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {/* Desktop Profile Actions */}
              <div className="hidden md:flex items-center space-x-1">
                <Button variant="ghost" size="icon" onClick={onSwitchProfile}>
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              {/* Mobile Theme Toggle Placeholder */}
              <div className="md:hidden w-10 h-10" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}