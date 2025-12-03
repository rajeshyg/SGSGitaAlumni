import { lazy, Suspense } from 'react'
import { DataTableSection } from './DataTableSection'
import { MainLayout } from './MainLayout'
import { InvitationSection } from './InvitationSection'
import { SessionViewer } from './SessionViewer'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { QualityDashboard } from '../dashboard/QualityDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import type { FileImport } from '../../services/APIService'

const StatusDashboard = lazy(() => import('./StatusDashboard'))

interface APIConfigStatus {
  isConfigured: boolean
  hasBaseUrl: boolean
}

interface Profile {
  id: number
  name: string
  role: string
  avatar: string
  preferences: { professionalStatus: string }
}

interface Stats {
  notifications: { unread: number }
  chat: { totalUnread: number }
  totalRecords: number
  processedFiles: number
  activeUsers: number
  systemHealth: string
}

interface AdminContentProps {
  fileImportData: FileImport[]
  apiConfig: APIConfigStatus
  navigate: (path: string) => void
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  handlePageChange: (newPage: number) => void
  refresh: () => void
  currentProfile: Profile
  stats: Stats
}

export function AdminContent({
  fileImportData,
  apiConfig,
  navigate,
  total,
  page,
  pageSize,
  hasMore,
  handlePageChange,
  refresh,
  currentProfile,
  stats
}: AdminContentProps) {
  return (
    <MainLayout currentProfile={currentProfile} stats={stats}>
      <div className="space-y-6">
        {/* Admin Dashboard Tabs - Core Functions */}
        <Tabs defaultValue="management" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="data-imports">Data Imports</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="space-y-6">
            {/* Alumni members, invitations, and users management */}
            <InvitationSection />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Invitation analytics, conversion funnel, and trends */}
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            {/* Code quality, architecture, security, performance analysis */}
            <QualityDashboard projectId="main" timeRange="30d" />
          </TabsContent>

          <TabsContent value="data-imports" className="space-y-6">
            <DataTableSection
              fileImportData={fileImportData}
              apiConfig={apiConfig}
              navigate={navigate}
              total={total}
              page={page}
              pageSize={pageSize}
              hasMore={hasMore}
              handlePageChange={handlePageChange}
              refresh={refresh}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            {/* Session analyzer and debugging */}
            <SessionViewer />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            {/* Development feature status tracking */}
            <Suspense fallback={<div className="text-center py-8"><p className="text-muted-foreground">Loading feature status...</p></div>}>
              <StatusDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}