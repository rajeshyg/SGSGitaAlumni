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

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Create a simple toast notification
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 animate-in fade-in slide-in-from-top-2 ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

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
    // Handle both string and object error responses
    const errorMessage = typeof data.error === 'string' 
      ? data.error 
      : (data.error?.message || `Failed to process moderation action`);
    throw new Error(errorMessage);
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
      const response = await makeModerationRequest('/api/moderation/approve', {
        postingId: posting.id,
        moderatorNotes: approvalNotes || undefined
      });
      console.log('✅ Approve succeeded:', response);
      showToast('✅ Posting approved successfully');
      onModerationComplete();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to approve posting';
      console.error('❌ Approve failed:', error);
      showToast(`❌ ${errorMsg}`, 'error');
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
      const response = await makeModerationRequest('/api/moderation/reject', {
        postingId: posting.id,
        reason: rejectionReason,
        feedbackToUser: rejectionFeedback,
        moderatorNotes: rejectionNotes || undefined
      });
      console.log('✅ Reject succeeded:', response);
      showToast('✅ Posting rejected successfully');
      onModerationComplete();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reject posting';
      console.error('❌ Reject failed:', error);
      showToast(`❌ ${errorMsg}`, 'error');
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
      const response = await makeModerationRequest('/api/moderation/escalate', {
        postingId: posting.id,
        escalationReason,
        escalationNotes
      });
      console.log('✅ Escalate succeeded:', response);
      showToast('✅ Posting escalated to admin team');
      onModerationComplete();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to escalate posting';
      console.error('❌ Escalate failed:', error);
      showToast(`❌ ${errorMsg}`, 'error');
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