/**
 * Posting Review Modal Component
 *
 * Modal for reviewing and moderating a posting
 * Includes approve, reject, and escalate actions
 *
 * Task: Action 8 - Moderator Review System
 * Date: November 4, 2025
 */

import { useEffect } from 'react';
import { usePostingDetails } from './usePostingDetails';
import { useModerationActions } from './useModerationActions';
import { useModerationFormState } from './useModerationFormState';
import { PostingReviewModalContent } from './PostingReviewModalContent';

interface PostingReviewModalProps {
  postingId: string;
  onClose: () => void;
  onModerationComplete: () => void;
}

export function PostingReviewModal({ postingId, onClose, onModerationComplete }: PostingReviewModalProps) {
  const postingDetails = usePostingDetails(postingId);
  const moderationActions = useModerationActions(postingDetails.posting, onModerationComplete);
  const formState = useModerationFormState();

  useEffect(() => {
    postingDetails.fetchPostingDetails();
  }, [postingDetails.fetchPostingDetails]);

  const contentProps = {
    loading: postingDetails.loading,
    error: postingDetails.error,
    posting: postingDetails.posting,
    submitterStats: postingDetails.submitterStats,
    moderationHistory: postingDetails.moderationHistory,
    actionInProgress: moderationActions.actionInProgress,
    showRejectForm: formState.showRejectForm,
    showEscalateForm: formState.showEscalateForm,
    approvalNotes: formState.approvalNotes,
    rejectionReason: formState.rejectionReason,
    rejectionFeedback: formState.rejectionFeedback,
    rejectionNotes: formState.rejectionNotes,
    escalationReason: formState.escalationReason,
    escalationNotes: formState.escalationNotes,
    onClose,
    onApprovalNotesChange: formState.setApprovalNotes,
    onRejectionReasonChange: formState.setRejectionReason,
    onRejectionFeedbackChange: formState.setRejectionFeedback,
    onRejectionNotesChange: formState.setRejectionNotes,
    onEscalationReasonChange: formState.setEscalationReason,
    onEscalationNotesChange: formState.setEscalationNotes,
    onShowRejectForm: () => formState.setShowRejectForm(true),
    onHideRejectForm: () => formState.setShowRejectForm(false),
    onShowEscalateForm: () => formState.setShowEscalateForm(true),
    onHideEscalateForm: () => formState.setShowEscalateForm(false),
    onApprove: () => moderationActions.handleApprove(formState.approvalNotes),
    onReject: () => moderationActions.handleReject(
      formState.rejectionReason,
      formState.rejectionFeedback,
      formState.rejectionNotes
    ),
    onEscalate: () => moderationActions.handleEscalate(
      formState.escalationReason,
      formState.escalationNotes
    )
  };

  return <PostingReviewModalContent {...contentProps} />;
}
