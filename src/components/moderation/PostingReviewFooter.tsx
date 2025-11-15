/**
 * Posting Review Footer Component
 *
 * Displays the footer with action buttons and forms
 */

import { Button } from '../ui/button';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ApprovalForm } from './ApprovalForm';
import { RejectionForm } from './RejectionForm';
import { EscalationForm } from './EscalationForm';
import type { RejectionReason, EscalationReason } from '../../types/moderation';

interface PostingReviewFooterProps {
  loading: boolean;
  error: string | null;
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

const CloseFooter = ({ onClose }: { onClose: () => void }) => (
  <DialogFooter>
    <DialogClose asChild>
      <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
    </DialogClose>
  </DialogFooter>
);

const RejectionFormView = (props: PostingReviewFooterProps) => (
  <RejectionForm
    rejectionReason={props.rejectionReason}
    onReasonChange={props.onRejectionReasonChange}
    rejectionFeedback={props.rejectionFeedback}
    onFeedbackChange={props.onRejectionFeedbackChange}
    rejectionNotes={props.rejectionNotes}
    onNotesChange={props.onRejectionNotesChange}
    onCancel={props.onHideRejectForm}
    onReject={props.onReject}
    actionInProgress={props.actionInProgress}
  />
);

const EscalationFormView = (props: PostingReviewFooterProps) => (
  <EscalationForm
    escalationReason={props.escalationReason}
    onReasonChange={props.onEscalationReasonChange}
    escalationNotes={props.escalationNotes}
    onNotesChange={props.onEscalationNotesChange}
    onCancel={props.onHideEscalateForm}
    onEscalate={props.onEscalate}
    actionInProgress={props.actionInProgress}
  />
);

const ApprovalFormView = (props: PostingReviewFooterProps) => (
  <ApprovalForm
    approvalNotes={props.approvalNotes}
    onNotesChange={props.onApprovalNotesChange}
    onApprove={props.onApprove}
    onEscalate={props.onShowEscalateForm}
    onReject={props.onShowRejectForm}
    actionInProgress={props.actionInProgress}
  />
);

export function PostingReviewFooter(props: PostingReviewFooterProps) {
  const { loading, error, showRejectForm, showEscalateForm } = props;

  if (loading || error) return <CloseFooter onClose={props.onClose} />;

  if (showRejectForm) return <RejectionFormView {...props} />;

  if (showEscalateForm) return <EscalationFormView {...props} />;

  return <ApprovalFormView {...props} />;
}