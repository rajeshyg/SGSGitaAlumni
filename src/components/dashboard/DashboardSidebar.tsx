import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Activity,
  Database,
  Upload,
  Download,
  Settings,
  Users,
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react'

interface UserProfile {
  id: string | number
  name: string
  role: string
  preferences?: {
    professionalStatus?: string
    theme?: string
    notifications?: boolean
  }
}

interface DashboardSidebarProps {
  currentProfile: UserProfile
  stats: {
    chat: { totalUnread: number }
  }
}

function ActionButton({
  icon: Icon,
  label,
  path,
  variant = "outline",
  showBadge = false,
  badgeText = "",
  hoverTransform = "group-hover:scale-110"
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  variant?: "default" | "outline"
  showBadge?: boolean
  badgeText?: string
  hoverTransform?: string
}) {
  const navigate = useNavigate()

  return (
    <Button
      className="w-full justify-start group min-h-[44px] text-sm"
      variant={variant}
      onClick={() => navigate(path)}
    >
      <Icon className={`h-4 w-4 mr-2 ${hoverTransform} transition-transform`} />
      <span className="truncate">{label}</span>
      {showBadge && (
        <Badge variant="secondary" className="ml-auto hidden sm:flex">
          {badgeText}
        </Badge>
      )}
    </Button>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center">
          <Activity className="h-4 w-4 mr-2 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 sm:p-6">
        <ActionButton
          icon={Upload}
          label="Upload Data"
          path="/upload"
          variant="default"
          showBadge={true}
          badgeText="New"
        />
        <ActionButton
          icon={Users}
          label="Alumni Directory"
          path="/alumni-directory"
        />
        <ActionButton
          icon={BarChart3}
          label="Reports"
          path="/reports"
        />
        <ActionButton
          icon={Database}
          label="Data Files"
          path="/data-files"
        />
        <ActionButton
          icon={Download}
          label="Export Data"
          path="/export"
          hoverTransform="group-hover:rotate-90"
        />
        <ActionButton
          icon={Settings}
          label="Settings"
          path="/settings"
          hoverTransform="group-hover:rotate-12"
        />
      </CardContent>
    </Card>
  )
}

function StatusItem({
  icon: Icon,
  label,
  status,
  iconColor,
  badgeColor
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: string
  iconColor: string
  badgeColor: string
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
      <div className="flex items-center space-x-3">
        <div className={iconColor}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className={`text-xs ${badgeColor}`}>
          {status}
        </Badge>
      </div>
    </div>
  )
}

function SystemStatus() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          System Status
        </CardTitle>
        <CardDescription className="text-xs">
          All systems operational
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <StatusItem
            icon={Database}
            label="Database"
            status="Online"
            iconColor="text-green-500"
            badgeColor="bg-green-100 text-green-800"
          />
          <StatusItem
            icon={Upload}
            label="File Processing"
            status="Active"
            iconColor="text-blue-500"
            badgeColor="bg-blue-100 text-blue-800"
          />
          <StatusItem
            icon={BarChart3}
            label="Analytics"
            status="Ready"
            iconColor="text-purple-500"
            badgeColor="bg-purple-100 text-purple-800"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Data file processed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">2m ago</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">User login</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">5m ago</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium">System backup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">1h ago</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSidebar({ currentProfile: _currentProfile, stats: _stats }: DashboardSidebarProps) {
  // Note: Parameters are kept for future extensibility but not currently used in this admin sidebar

  return (
    <div className="space-y-4 lg:space-y-6">
      <QuickActions />
      <SystemStatus />
      <RecentActivity />
    </div>
  )
}