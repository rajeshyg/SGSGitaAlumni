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

function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center">
          <Activity className="h-4 w-4 mr-2 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 sm:p-6">
        <Button
          className="w-full justify-start group min-h-[44px] text-sm"
          variant="default"
          onClick={() => navigate('/upload')}
        >
          <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="truncate">Upload Data</span>
          <Badge variant="secondary" className="ml-auto hidden sm:flex">
            New
          </Badge>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start group min-h-[44px] text-sm"
          onClick={() => navigate('/alumni-directory')}
        >
          <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="truncate">Alumni Directory</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start group min-h-[44px] text-sm"
          onClick={() => navigate('/reports')}
        >
          <BarChart3 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="truncate">Reports</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start group min-h-[44px] text-sm"
          onClick={() => navigate('/data-files')}
        >
          <Database className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          <span className="truncate">Data Files</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start group min-h-[44px] text-sm"
          onClick={() => navigate('/export')}
        >
          <Download className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
          <span className="truncate">Export Data</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start group min-h-[44px] text-sm"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
          <span className="truncate">Settings</span>
        </Button>
      </CardContent>
    </Card>
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
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="text-green-500">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="text-blue-500">
                <Upload className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">File Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="text-purple-500">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                Ready
              </Badge>
            </div>
          </div>
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