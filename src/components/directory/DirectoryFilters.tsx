/**
 * DirectoryFilters Component
 * Filter controls for alumni directory (year, department, sorting)
 * Responsive design with mobile-friendly dropdowns
 */

import React from 'react';
import { Button } from '../ui/button';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DirectoryFilters as FilterOptions, SortOption } from '../../types/directory';

export interface DirectoryFiltersProps {
  filters: FilterOptions | null;
  selectedYear?: number;
  selectedDepartment?: string;
  sortBy: 'name' | 'graduationYear' | 'recent';
  sortOrder: 'asc' | 'desc';
  onYearChange: (year: number | undefined) => void;
  onDepartmentChange: (dept: string | undefined) => void;
  onSortByChange: (sortBy: 'name' | 'graduationYear' | 'recent') => void;
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  onClearFilters: () => void;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'graduationYear', label: 'Graduation Year' },
  { value: 'recent', label: 'Recently Added' }
];

/**
 * DirectoryFilters - Filter and sort controls for alumni directory
 */
export const DirectoryFilters: React.FC<DirectoryFiltersProps> = ({
  filters,
  selectedYear,
  selectedDepartment,
  sortBy,
  sortOrder,
  onYearChange,
  onDepartmentChange,
  onSortByChange,
  onSortOrderChange,
  onClearFilters,
  className
}) => {
  const hasActiveFilters = selectedYear !== undefined || selectedDepartment !== undefined;

  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Graduation Year Filter */}
        <div>
          <label htmlFor="year-filter" className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Graduation Year
          </label>
          <select
            id="year-filter"
            value={selectedYear || ''}
            onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Years</option>
            {filters?.graduationYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="dept-filter" className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Department
          </label>
          <select
            id="dept-filter"
            value={selectedDepartment || ''}
            onChange={(e) => onDepartmentChange(e.target.value || undefined)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Departments</option>
            {filters?.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sort-by" className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'name' | 'graduationYear' | 'recent')}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order Toggle */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Sort Order
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="w-full h-9 justify-start"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>
      </div>

      {/* Active Filters Summary (Mobile) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 sm:hidden">
          {selectedYear && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onYearChange(undefined)}
              className="h-7 text-xs"
            >
              Year: {selectedYear}
              <X className="h-3 w-3 ml-1" />
            </Button>
          )}
          {selectedDepartment && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDepartmentChange(undefined)}
              className="h-7 text-xs"
            >
              {selectedDepartment}
              <X className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectoryFilters;
