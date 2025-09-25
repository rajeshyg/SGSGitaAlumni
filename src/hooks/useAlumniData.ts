import { useState, useEffect, useCallback } from 'react';
import { APIService } from '../services/APIService';
import type {
  AlumniProfile,
  SearchFilters,
  DirectoryParams,
  DirectoryResponse,
  Posting,
  PostingFilters
} from '../services/APIService';

// ============================================================================
// ALUMNI PROFILE HOOKS
// ============================================================================

// ============================================================================
// ALUMNI PROFILE HOOKS
// ============================================================================

export function useAlumniProfile(userId?: string) {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id?: string) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await APIService.getAlumniProfile(id);
      setProfile(profileData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: AlumniProfile) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedProfile = await APIService.updateProfile(profileData);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
