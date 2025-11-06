/**
 * Custom hook for fetching posting details
 */

import { useState, useCallback } from 'react';
import type { PostingDetail, SubmitterStats, ModerationHistoryItem } from '../../types/moderation';

export function usePostingDetails(postingId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState<PostingDetail | null>(null);
  const [submitterStats, setSubmitterStats] = useState<SubmitterStats | null>(null);
  const [moderationHistory, setModerationHistory] = useState<ModerationHistoryItem[]>([]);

  const fetchPostingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/moderation/posting/${postingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posting details');
      }

      const data = await response.json();

      if (data.success) {
        setPosting(data.data.posting);
        setSubmitterStats(data.data.submitterStats);
        setModerationHistory(data.data.moderationHistory);
      } else {
        throw new Error(data.error || 'Failed to load posting');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posting details');
    } finally {
      setLoading(false);
    }
  }, [postingId]);

  return {
    loading,
    error,
    posting,
    submitterStats,
    moderationHistory,
    fetchPostingDetails
  };
}