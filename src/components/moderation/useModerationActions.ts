/**
 * Custom hook for moderation actions
 */

import { useState, useCallback } from 'react';
import type { PostingDetail, RejectionReason, EscalationReason } from '../../types/moderation';

// Utility functions
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
});

const validateRejectionFeedback = (feedback: string) => {
  if (!feedback.trim() || feedback.length < 10) {
    throw new Error('Please provide feedback to the user (at least 10 characters)');
  }
};

const validateEscalationNotes = (notes: string) => {
  if (!notes.trim() || notes.length < 10) {
    throw new Error('Please provide escalation notes (at least 10 characters)');
  }
};

const makeModerationRequest = async (endpoint: string, body: any) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Failed to process moderation action`);
  }

  return data;
};

export function useModerationActions(
  posting: PostingDetail | null,
  onModerationComplete: () => void
) {
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleApprove = useCallback(async (approvalNotes: string) => {
    if (!posting) return;

    setActionInProgress(true);
    try {
      await makeModerationRequest('/api/moderation/approve', {
        postingId: posting.id,
        moderatorNotes: approvalNotes || undefined
      });
      onModerationComplete();
    } finally {
      setActionInProgress(false);
    }
  }, [posting, onModerationComplete]);

  const handleReject = useCallback(async (
    rejectionReason: RejectionReason,
    rejectionFeedback: string,
    rejectionNotes: string
  ) => {
    if (!posting) return;

    validateRejectionFeedback(rejectionFeedback);

    setActionInProgress(true);
    try {
      await makeModerationRequest('/api/moderation/reject', {
        postingId: posting.id,
        reason: rejectionReason,
        feedbackToUser: rejectionFeedback,
        moderatorNotes: rejectionNotes || undefined
      });
      onModerationComplete();
    } finally {
      setActionInProgress(false);
    }
  }, [posting, onModerationComplete]);

  const handleEscalate = useCallback(async (
    escalationReason: EscalationReason,
    escalationNotes: string
  ) => {
    if (!posting) return;

    validateEscalationNotes(escalationNotes);

    setActionInProgress(true);
    try {
      await makeModerationRequest('/api/moderation/escalate', {
        postingId: posting.id,
        escalationReason,
        escalationNotes
      });
      onModerationComplete();
    } finally {
      setActionInProgress(false);
    }
  }, [posting, onModerationComplete]);

  return {
    actionInProgress,
    handleApprove,
    handleReject,
    handleEscalate
  };
}