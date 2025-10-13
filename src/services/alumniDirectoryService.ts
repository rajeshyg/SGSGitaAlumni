/**
 * Alumni Directory Service
 * Service for fetching and managing alumni directory data
 */

import { apiClient } from '../lib/api';
import type {
  DirectoryResponse,
  DirectoryParams,
  AlumniMember
} from '../types/directory';

/**
 * Alumni Directory Service
 * Provides methods for fetching and searching alumni directory
 */
export const alumniDirectoryService = {
  /**
   * Get alumni directory with pagination and filters
   * @param params Query parameters for filtering, sorting, and pagination
   * @returns Promise<DirectoryResponse>
   */
  async getDirectory(params: DirectoryParams = {}): Promise<DirectoryResponse> {
    const queryParams = new URLSearchParams();

    // Add search query
    if (params.q) {
      queryParams.append('q', params.q);
    }

    // Add pagination
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.perPage) {
      queryParams.append('perPage', params.perPage.toString());
    }

    // Add year filters
    if (params.graduationYear) {
      queryParams.append('graduationYear', params.graduationYear.toString());
    }
    if (params.graduationYearMin) {
      queryParams.append('graduationYearMin', params.graduationYearMin.toString());
    }
    if (params.graduationYearMax) {
      queryParams.append('graduationYearMax', params.graduationYearMax.toString());
    }

    // Add department filter
    if (params.department) {
      queryParams.append('department', params.department);
    }

    // Add sorting
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/alumni/directory${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.request(endpoint, {
      method: 'GET'
    });

    return response as DirectoryResponse;
  },

  /**
   * Get individual alumni member profile
   * @param id Alumni member ID
   * @returns Promise<AlumniMember>
   */
  async getAlumniProfile(id: number): Promise<AlumniMember> {
    const response = await apiClient.request(`/api/alumni-members/${id}`, {
      method: 'GET'
    });

    return response as AlumniMember;
  },

  /**
   * Search alumni members (legacy endpoint for backward compatibility)
   * @param query Search query
   * @param limit Results limit
   * @returns Promise<AlumniMember[]>
   */
  async searchAlumni(query: string, limit = 50): Promise<AlumniMember[]> {
    const queryParams = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });

    const response = await apiClient.request(`/api/alumni-members/search?${queryParams.toString()}`, {
      method: 'GET'
    });

    return response as AlumniMember[];
  }
};

export default alumniDirectoryService;
