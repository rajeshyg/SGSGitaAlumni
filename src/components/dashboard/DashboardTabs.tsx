import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import Badge from '../ui/badge'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Progress } from '../ui/progress'
import {
  Database,
  FileText,
  Users,
  BarChart3,
  Upload,
  Activity,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'

interface SystemStats {
  database: { status: string; uptime: number }
  fileProcessing: { status: string; queueLength: number }
  analytics: { status: string; lastUpdate: string }
}

interface ActivityItem {
  id: string
  type: 'upload' | 'user' | 'report'
  description: string
  timestamp: string
}


interface DashboardTabsProps {
  stats: SystemStats
  personalizedPosts?: ActivityItem[]
  recentActivity?: ActivityItem[]
  recommendedConnections?: unknown[]
  trendingPosts?: unknown[]
  connections?: unknown[]
  conversationPreviews?: unknown[]
  profile?: {
    id: string
    name: string
    role: string
  }
}

function SystemStatusCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">System Status</CardTitle>
        <CheckCircle2 className="h-5 w-5 text-[--success]" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4 text-[--primary]" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="secondary" className="bg-[--success-bg] text-[--success-foreground]">Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="h-4 w-4 text-[--accent]" />
                <span className="text-sm font-medium">File Processing</span>
              </div>
              <Badge variant="secondary" className="bg-[--info-bg] text-[--info-foreground]">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-4 w-4 text-[--warning]" />
                <span className="text-sm font-medium">Analytics</span>
              </div>
              <Badge variant="secondary" className="bg-[--accent-bg] text-[--accent-foreground]">Ready</Badge>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard({ onViewAll }: { onViewAll: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <p>New data file uploaded: alumni_2024.csv</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <p>User registration: john.doe@example.com</p>
                <p className="text-xs text-muted-foreground mt-1">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <p>Report generated: Monthly Summary</p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function PerformanceMetricCard({
  title,
  value: _value,
  trend: _trend,
  description,
  badgeText,
  trendIcon: TrendIcon,
  trendValue
}: {
  title: string
  value: string
  trend: string
  description: string
  badgeText: string
  trendIcon: React.ComponentType<{ className?: string }>
  trendValue: string
}) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary" className="text-xs">{badgeText}</Badge>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <TrendIcon className="h-3 w-3" />
          <span>{trendValue}</span>
        </div>
      </div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function QuickStatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          System Performance
        </CardTitle>
        <CardDescription>
          Key metrics and performance indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PerformanceMetricCard
            title="File Processing Rate"
            value="98%"
            trend="+12%"
            description="98% success rate"
            badgeText="Data Processing"
            trendIcon={TrendingUp}
            trendValue="+12%"
          />
          <PerformanceMetricCard
            title="Active Sessions"
            value="24"
            trend="+8%"
            description="24 users online"
            badgeText="User Activity"
            trendIcon={TrendingUp}
            trendValue="+8%"
          />
          <PerformanceMetricCard
            title="Uptime"
            value="99.9%"
            trend="99.9%"
            description="Last 30 days"
            badgeText="System Health"
            trendIcon={CheckCircle2}
            trendValue="99.9%"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewTab({ stats: _stats }: { stats: SystemStats }) {
  const [, setActiveTab] = useState('overview')

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStatusCard />
        <RecentActivityCard onViewAll={() => setActiveTab('data')} />
      </div>
      <QuickStatsCard />
    </TabsContent>
  )
}

function DataTab() {
  const navigate = useNavigate()

  return (
    <TabsContent value="data" className="space-y-4">
      <div className="text-center py-8">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Data Management</h3>
        <p className="text-muted-foreground mb-4">Upload, process, and manage alumni data files</p>
        <Button onClick={() => navigate('/upload')}>Upload New Data</Button>
      </div>
    </TabsContent>
  )
}

function UsersTab() {
  const navigate = useNavigate()

  return (
    <TabsContent value="users">
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">User Management</h3>
        <p className="text-muted-foreground mb-4">Manage user accounts and permissions</p>
        <Button onClick={() => navigate('/users')}>Manage Users</Button>
      </div>
    </TabsContent>
  )
}

function ReportsTab() {
  return (
    <TabsContent value="reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
            <CardDescription>Generate comprehensive reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Files Report</span>
                <Button size="sm" variant="outline">Generate</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">User Activity Report</span>
                <Button size="sm" variant="outline">Generate</Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">System Performance</span>
                <Button size="sm" variant="outline">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>System usage and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={85} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              System utilization at 85% capacity
            </p>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  )
}

export function DashboardTabs({
  stats,
  personalizedPosts: _personalizedPosts,
  recentActivity: _recentActivity,
  recommendedConnections: _recommendedConnections,
  trendingPosts: _trendingPosts,
  connections: _connections,
  conversationPreviews: _conversationPreviews,
  profile: _profile
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex-1">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <OverviewTab stats={stats} />
        <DataTab />
        <UsersTab />
        <ReportsTab />
      </Tabs>
    </div>
  )
}