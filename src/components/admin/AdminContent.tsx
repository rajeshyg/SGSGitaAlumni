import { DataTableSection } from './DataTableSection'
import { MainLayout } from './MainLayout'
import { QualityDashboard } from '../dashboard/QualityDashboard'
import { InvitationSection } from './InvitationSection'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import type { FileImport } from '../../services/APIService'

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
      <div className="space-y-8">
        {/* AI Quality Orchestration Dashboard */}
        <QualityDashboard
          projectId="sgs-gita-alumni"
          timeRange="30d"
          onRefresh={() => {}}
        />

        {/* Invitation Management Section */}
        <InvitationSection />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Data Management Section */}
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
      </div>
    </MainLayout>
  )
}