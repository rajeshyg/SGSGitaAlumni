import { useState, useEffect, useCallback } from 'react';
import { APIService, type SearchFilters, type DirectoryParams, type DirectoryResponse, type Posting, type PostingFilters } from '../services/APIService';

// ============================================================================
// ALUMNI PROFILE HOOKS
// ============================================================================

// ============================================================================
// ALUMNI PROFILE HOOKS
// ============================================================================

export interface UserExtendedProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  bio?: string;
  [key: string]: unknown;
}

export function useAlumniProfile(userId?: string) {
  const [profile, setProfile] = useState<UserExtendedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id?: string) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      let profileData: any | null = null;
      try {
        profileData = await APIService.getUserProfile(id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // If extended profile is missing (404), attempt to fetch current user or initialize empty profile
        if (/404/.test(msg)) {
          try {
            const current = await APIService.getCurrentUser();
            profileData = { userId: current.id, firstName: current.firstName, lastName: current.lastName };
          } catch {
            profileData = { userId: id };
          }
        } else {
          throw e;
        }
      }
      setProfile(profileData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserExtendedProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      if (!userId) throw new Error('Missing userId for profile update');
      const updatedProfile = await APIService.updateUserProfile(userId, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    refetch: () => fetchProfile(userId)
  };
}

// ============================================================================
// ALUMNI DIRECTORY HOOKS
// ============================================================================

export function useAlumniDirectory(initialParams: DirectoryParams) {
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = useCallback(async (params: DirectoryParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const directoryData = await APIService.getAlumniDirectory(params);
      setDirectory(directoryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch directory';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchAlumni = useCallback(async (filters: SearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);
      return await APIService.searchAlumni(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search alumni';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory(initialParams);
  }, [fetchDirectory, initialParams]);

  return {
    directory,
    isLoading,
    error,
    fetchDirectory,
    searchAlumni,
    refetch: () => fetchDirectory(initialParams)
  };
}

// ============================================================================
// POSTINGS HOOKS
// ============================================================================

export function usePostings(initialFilters: PostingFilters = {}) {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostings = useCallback(async (filters: PostingFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const postingsData = await APIService.getPostings(filters);
      setPostings(postingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch postings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostings(initialFilters);
  }, [fetchPostings, initialFilters]);

  return {
    postings,
    isLoading,
    error,
    fetchPostings,
    refetch: () => fetchPostings(initialFilters)
  };
}
