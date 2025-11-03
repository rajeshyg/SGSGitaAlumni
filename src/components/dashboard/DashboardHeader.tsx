import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import Badge from '../ui/badge'
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
import { ThemeToggle } from '../theme/ThemeToggle'

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
  isFamilyAccount?: boolean
  onSwitchProfile: () => void
  onLogout: () => void
}

function LogoSection() {
  return (
    <div className="flex items-center space-x-3">
      <img
        src="/images/opportunities/sgsgf-logo.png"
        alt="SGS Gita Foundation Logo"
        className="h-8 w-auto"
      />
      <div>
        <h1 className="text-lg font-bold">SGS Gita Connect</h1>
        <p className="text-xs text-muted-foreground hidden sm:block">Alumni Management Platform</p>
      </div>
    </div>
  )
}

function DesktopNavigation({ stats }: { stats: DashboardHeaderProps['stats'] }) {
  const navigate = useNavigate()

  return (
    <div className="hidden md:flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        onClick={() => navigate('/alumni-directory')}
      >
        <Search className="h-4 w-4 mr-2" />
        Search alumni...
      </Button>

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

      <ThemeToggle />
      <Separator orientation="vertical" className="h-6" />
    </div>
  )
}

function NotificationMenuItem({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate()

  return (
    <DropdownMenuItem onClick={() => navigate('/responses')}>
      <Bell className="h-4 w-4 mr-2" />
      Notifications
      {unreadCount > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
          {unreadCount}
        </Badge>
      )}
    </DropdownMenuItem>
  )
}

function MessageMenuItem({ unreadCount }: { unreadCount: number }) {
  const navigate = useNavigate()

  return (
    <DropdownMenuItem onClick={() => navigate('/chat')}>
      <MessageSquare className="h-4 w-4 mr-2" />
      Messages
      {unreadCount > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 text-xs">
          {unreadCount}
        </Badge>
      )}
    </DropdownMenuItem>
  )
}

function ProfileMenuItems({
  isFamilyAccount,
  onSwitchProfile,
  onLogout
}: {
  isFamilyAccount?: boolean
  onSwitchProfile: () => void
  onLogout: () => void
}) {
  return (
    <>
      <DropdownMenuSeparator />
      {isFamilyAccount && (
        <DropdownMenuItem onClick={onSwitchProfile}>
          <UserPlus className="h-4 w-4 mr-2" />
          Switch Profile
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </>
  )
}

function MobileMenu({ stats, isFamilyAccount, onSwitchProfile, onLogout }: {
  stats: DashboardHeaderProps['stats']
  isFamilyAccount?: boolean
  onSwitchProfile: () => void
  onLogout: () => void
}) {
  const navigate = useNavigate()

  return (
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
          <NotificationMenuItem unreadCount={stats.notifications.unread} />
          <MessageMenuItem unreadCount={stats.chat.totalUnread} />
          <ProfileMenuItems isFamilyAccount={isFamilyAccount} onSwitchProfile={onSwitchProfile} onLogout={onLogout} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ProfileSection({ currentProfile, isFamilyAccount, onSwitchProfile, onLogout }: {
  currentProfile: UserProfile
  isFamilyAccount?: boolean
  onSwitchProfile: () => void
  onLogout: () => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="hidden lg:block text-right">
        <p className="text-sm font-medium">{currentProfile.name}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {currentProfile.preferences?.professionalStatus
            ? `${currentProfile.preferences.professionalStatus} • ${currentProfile.role}`
            : currentProfile.role}
        </p>
      </div>
      <Avatar className="h-8 w-8 border-2 border-primary/20">
        <AvatarImage src={currentProfile.avatar} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {currentProfile.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="hidden md:flex items-center space-x-1">
        {isFamilyAccount && (
          <Button variant="ghost" size="icon" onClick={onSwitchProfile} title="Switch Profile">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <div className="md:hidden">
        <ThemeToggle />
      </div>
    </div>
  )
}

export function DashboardHeader({ currentProfile, stats, isFamilyAccount, onSwitchProfile, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <LogoSection />

          <div className="flex items-center space-x-2">
            <DesktopNavigation stats={stats} />
            <MobileMenu stats={stats} isFamilyAccount={isFamilyAccount} onSwitchProfile={onSwitchProfile} onLogout={onLogout} />
            <ProfileSection currentProfile={currentProfile} isFamilyAccount={isFamilyAccount} onSwitchProfile={onSwitchProfile} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  )
}