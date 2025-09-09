import { useLazyData } from './useLazyData'
import { APIService, type FileImport } from '../services/APIService'
import { getCurrentProfile } from '../components/admin/admin-utils'

export function useAdminData() {
  // Data fetching with lazy loading and caching
  const {
    data: fileImportData,
    total,
    page,
    pageSize,
    hasMore,
    loadMore,
    refresh,
    loading,
    error
  } = useLazyData({
    pageSize: 10,
    enableCache: true,
    cacheTtl: 5 * 60 * 1000,
    autoLoad: true
  })

  // Get user profile and API config
  const currentProfile = getCurrentProfile()
  const apiConfig = APIService.getAPIConfigStatus()

  // Calculate statistics
  const stats = calculateStats(fileImportData)

  return {
    fileImportData,
    total,
    page,
    pageSize,
    hasMore,
    loadMore,
    refresh,
    loading,
    error,
    currentProfile,
    apiConfig,
    stats
  }
}

function calculateStats(fileImportData: FileImport[]) {
  // This would be imported from admin-utils if not already available
  const completedImports = fileImportData.filter(imp => imp.status === 'completed').length
  const totalRecords = fileImportData.reduce((sum, imp) => sum + imp.records_count, 0)
  const totalErrors = fileImportData.reduce((sum, imp) => sum + imp.errors_count, 0)

  return {
    notifications: { unread: totalErrors > 0 ? 1 : 0 },
    chat: { totalUnread: 0 },
    totalRecords,
    processedFiles: completedImports,
    activeUsers: 1, // Current user
    systemHealth: 'good' as const
  }
}