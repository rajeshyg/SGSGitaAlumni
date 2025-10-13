/**
 * Alumni Directory Types
 * Type definitions for alumni directory feature
 */

/**
 * Individual Alumni Member
 */
export interface AlumniMember {
  id: number;
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  graduationYear: number | string;  // Can be number or string (e.g., "B9", "ADMIN")
  degree: string;
  department: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination Metadata
 */
export interface DirectoryPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Filter Options
 */
export interface DirectoryFilters {
  graduationYears: number[];
  departments: string[];
}

/**
 * Directory API Response
 */
export interface DirectoryResponse {
  success: boolean;
  data: AlumniMember[];
  pagination: DirectoryPagination;
  filters: DirectoryFilters;
}

/**
 * Directory Query Parameters
 */
export interface DirectoryParams {
  q?: string;                     // Search query
  page?: number;                  // Page number
  perPage?: number;               // Items per page
  graduationYear?: number;        // Specific year filter
  graduationYearMin?: number;     // Year range min
  graduationYearMax?: number;     // Year range max
  department?: string;            // Department filter
  sortBy?: 'name' | 'graduationYear' | 'recent';  // Sort field
  sortOrder?: 'asc' | 'desc';     // Sort direction
}

/**
 * Directory State
 */
export interface DirectoryState {
  data: AlumniMember[];
  pagination: DirectoryPagination | null;
  filters: DirectoryFilters | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Sort Option
 */
export interface SortOption {
  value: 'name' | 'graduationYear' | 'recent';
  label: string;
}

/**
 * Per Page Option
 */
export interface PerPageOption {
  value: number;
  label: string;
}
