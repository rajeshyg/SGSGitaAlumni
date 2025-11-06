/**
 * Posting Review Modal Content Component
 *
 * The main content of the posting review modal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PostingReviewContent } from './PostingReviewContent';
import { PostingReviewFooter } from './PostingReviewFooter';
import type { PostingDetail, SubmitterStats, ModerationHistoryItem, RejectionReason, EscalationReason } from '../../types/moderation';

interface PostingReviewModalContentProps {
  loading: boolean;
  error: string | null;
  posting: PostingDetail | null;
  submitterStats: SubmitterStats | null;
  moderationHistory: ModerationHistoryItem[];
  actionInProgress: boolean;
  showRejectForm: boolean;
  showEscalateForm: boolean;
  approvalNotes: string;
  rejectionReason: RejectionReason;
  rejectionFeedback: string;
  rejectionNotes: string;
  escalationReason: EscalationReason;
  escalationNotes: string;
  onClose: () => void;
  onApprovalNotesChange: (notes: string) => void;
  onRejectionReasonChange: (reason: RejectionReason) => void;
  onRejectionFeedbackChange: (feedback: string) => void;
  onRejectionNotesChange: (notes: string) => void;
  onEscalationReasonChange: (reason: EscalationReason) => void;
  onEscalationNotesChange: (notes: string) => void;
  onShowRejectForm: () => void;
  onHideRejectForm: () => void;
  onShowEscalateForm: () => void;
  onHideEscalateForm: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
}

export function PostingReviewModalContent(props: PostingReviewModalContentProps) {
  const footerProps = {
    loading: props.loading,
    error: props.error,
    actionInProgress: props.actionInProgress,
    showRejectForm: props.showRejectForm,
    showEscalateForm: props.showEscalateForm,
    approvalNotes: props.approvalNotes,
    rejectionReason: props.rejectionReason,
    rejectionFeedback: props.rejectionFeedback,
    rejectionNotes: props.rejectionNotes,
    escalationReason: props.escalationReason,
    escalationNotes: props.escalationNotes,
    onClose: props.onClose,
    onApprovalNotesChange: props.onApprovalNotesChange,
    onRejectionReasonChange: props.onRejectionReasonChange,
    onRejectionFeedbackChange: props.onRejectionFeedbackChange,
    onRejectionNotesChange: props.onRejectionNotesChange,
    onEscalationReasonChange: props.onEscalationReasonChange,
    onEscalationNotesChange: props.onEscalationNotesChange,
    onShowRejectForm: props.onShowRejectForm,
    onHideRejectForm: props.onHideRejectForm,
    onShowEscalateForm: props.onShowEscalateForm,
    onHideEscalateForm: props.onHideEscalateForm,
    onApprove: props.onApprove,
    onReject: props.onReject,
    onEscalate: props.onEscalate
  };

  return (
    <Dialog open={true} onOpenChange={(open: boolean) => !open && props.onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review Posting</DialogTitle>
        </DialogHeader>
        <PostingReviewContent
          loading={props.loading}
          error={props.error}
          posting={props.posting}
          submitterStats={props.submitterStats}
          moderationHistory={props.moderationHistory}
        />
        <div className="mt-6 pt-4 border-t border-border">
          <PostingReviewFooter {...footerProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
}