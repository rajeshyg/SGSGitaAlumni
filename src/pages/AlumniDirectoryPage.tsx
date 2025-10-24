/**
 * AlumniDirectoryPage
 * Main page for alumni directory with search, filters, and pagination
 * Fully responsive with mobile/tablet/desktop layouts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlumniDirectory } from '../hooks/useAlumniDirectory';
import { AlumniCard } from '../components/directory/AlumniCard';
import { DirectorySearch } from '../components/directory/DirectorySearch';
import { DirectoryFilters } from '../components/directory/DirectoryFilters';
import { DirectoryPagination } from '../components/directory/DirectoryPagination';
import { Loader2, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import type { AlumniMember } from '../types/directory';

/**
 * AlumniDirectoryPage - Main directory page component
 */
export const AlumniDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [perPage, setPerPage] = useState(20);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    pagination,
    filters,
    loading,
    error,
    setPage,
    setPerPage: updatePerPage,
    setSearch,
    setGraduationYear,
    setDepartment,
    setSortBy,
    setSortOrder
  } = useAlumniDirectory({
    page: 1,
    perPage,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    updatePerPage(newPerPage);
  };

  const handleYearChange = (year: number | undefined) => {
    setSelectedYear(year);
    setGraduationYear(year);
  };

  const handleDepartmentChange = (dept: string | undefined) => {
    setSelectedDepartment(dept);
    setDepartment(dept);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSearch(query);
  };

  const handleClearFilters = () => {
    setSelectedYear(undefined);
    setSelectedDepartment(undefined);
    setGraduationYear(undefined);
    setDepartment(undefined);
  };

  const handleAlumniClick = (alumni: AlumniMember) => {
    // TODO: Navigate to alumni profile page
    console.log('View alumni profile:', alumni);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold">Alumni Directory</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Connect with fellow alumni
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Search */}
          <DirectorySearch
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search alumni by name or email..."
          />

          {/* Filters */}
          {filters && (
            <DirectoryFilters
              filters={filters}
              selectedYear={selectedYear}
              selectedDepartment={selectedDepartment}
              sortBy="name"
              sortOrder="asc"
              onYearChange={handleYearChange}
              onDepartmentChange={handleDepartmentChange}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <h3 className="font-semibold">Error Loading Directory</h3>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading alumni directory...</span>
            </div>
          )}

          {/* Alumni Grid */}
          {!loading && !error && data.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.map((alumni) => (
                  <AlumniCard
                    key={alumni.id}
                    alumni={alumni}
                    onClick={handleAlumniClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && (
                <DirectoryPagination
                  pagination={pagination}
                  perPage={perPage}
                  onPageChange={setPage}
                  onPerPageChange={handlePerPageChange}
                />
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Alumni Found</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {searchQuery || selectedYear || selectedDepartment
                  ? 'Try adjusting your search or filters'
                  : 'No alumni members are currently available in the directory'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniDirectoryPage;
