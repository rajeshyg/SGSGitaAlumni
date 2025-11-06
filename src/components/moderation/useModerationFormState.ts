/**
 * Custom hook for moderation form state
 */

import { useState } from 'react';
import type { RejectionReason, EscalationReason } from '../../types/moderation';

export function useModerationFormState() {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showEscalateForm, setShowEscalateForm] = useState(false);

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('OTHER');
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Escalation form state
  const [escalationReason, setEscalationReason] = useState<EscalationReason>('OTHER');
  const [escalationNotes, setEscalationNotes] = useState('');

  // Approval form state
  const [approvalNotes, setApprovalNotes] = useState('');

  return {
    showRejectForm,
    showEscalateForm,
    rejectionReason,
    rejectionFeedback,
    rejectionNotes,
    escalationReason,
    escalationNotes,
    approvalNotes,
    setShowRejectForm,
    setShowEscalateForm,
    setRejectionReason,
    setRejectionFeedback,
    setRejectionNotes,
    setEscalationReason,
    setEscalationNotes,
    setApprovalNotes
  };
}