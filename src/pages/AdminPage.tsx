import { useNavigate } from 'react-router-dom'
import { useAdminData } from '../hooks/useAdminData'
import { LoadingState, ErrorState } from '../components/admin/AdminHelpers'
import { AdminContent } from '../components/admin/AdminContent'

export function AdminPage() {
  const navigate = useNavigate()
  const {
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
  } = useAdminData()

  const handlePageChange = (newPage: number) =>
    newPage >= 0 && hasMore && loadMore()

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  return (
    <AdminContent
      fileImportData={fileImportData}
      apiConfig={apiConfig}
      navigate={navigate}
      total={total}
      page={page}
      pageSize={pageSize}
      hasMore={hasMore}
      handlePageChange={handlePageChange}
      refresh={refresh}
      currentProfile={currentProfile}
      stats={stats}
    />
  )
}