import React from 'react'
import { useNavigate } from 'react-router-dom'
import { APIService } from '../services/APIService'
import { useLazyData } from '../hooks/useLazyData'
import { LoadingState, ErrorState, calculateStats, getCurrentProfile } from '../components/admin/AdminHelpers'
import { MainLayout } from '../components/admin/MainLayout'
import { DataTableSection } from '../components/admin/DataTableSection'


export function AdminPage() {
  const navigate = useNavigate();

  // Data fetching with lazy loading and caching
  const dataState = useLazyData({
    pageSize: 10,
    enableCache: true,
    cacheTtl: 5 * 60 * 1000,
    autoLoad: true
  });

  // Get user profile and API config
  const currentProfile = getCurrentProfile();
  const apiConfig = APIService.getAPIConfigStatus();

  if (dataState.loading) {
    return <LoadingState />;
  }

  if (dataState.error) {
    return <ErrorState error={dataState.error} />;
  }

  // Calculate statistics
  const stats = calculateStats(dataState.data);

  const handlePageChange = (newPage: number) =>
    newPage >= 0 && dataState.hasMore && dataState.loadMore();



  return (
    <MainLayout currentProfile={currentProfile} stats={stats}>
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
    </MainLayout>
  );
}