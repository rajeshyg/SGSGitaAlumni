import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Database,
  FileText,
  Upload
} from 'lucide-react'

interface UserProfile {
  id: string | number
  name: string
  role: string
  email?: string
}

interface SystemStats {
  totalRecords: number
  processedFiles: number
  activeUsers: number
  systemHealth: string
}

interface WelcomeHeroSectionProps {
  profile: UserProfile
  stats: SystemStats
  totalEngagement: number
}

function WelcomeHeader({ profile }: { profile: UserProfile }) {
  const [currentTime] = useState(new Date())

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
      <div className="mb-4 lg:mb-0">
        <h2 className="text-3xl font-bold mb-2">
          {getGreeting()}, {profile?.name?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Welcome to the SGSGita Alumni System. Manage alumni data, track engagement, and oversee system operations.
        </p>
      </div>
      <ActionButtons />
    </div>
  )
}

function ActionButtons() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => navigate('/upload')} className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Upload Data
      </Button>
      <Button variant="outline" onClick={() => navigate('/reports')}>
        <FileText className="h-4 w-4 mr-2" />
        View Reports
      </Button>
    </div>
  )
}

function MetricsGrid({ stats }: { stats: SystemStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold text-primary">{stats?.totalRecords || 0}</p>
            </div>
            <Database className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Files Processed</p>
              <p className="text-2xl font-bold text-primary">{stats?.processedFiles || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-primary">{stats?.activeUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-2xl font-bold text-green-500">Healthy</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function WelcomeHeroSection({ profile, stats, totalEngagement: _totalEngagement }: WelcomeHeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <WelcomeHeader profile={profile} />
        <MetricsGrid stats={stats} />
      </div>
    </div>
  )
}