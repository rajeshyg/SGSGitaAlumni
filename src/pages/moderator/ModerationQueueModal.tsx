/**
 * Moderation Queue Modal Component
 *
 * Modal management for the moderation queue page
 */

import { PostingReviewModal } from '../../components/moderation/PostingReviewModal';

interface ModerationQueueModalProps {
  selectedPosting: string | null;
  onClose: () => void;
  onModerationComplete: () => void;
}

export function ModerationQueueModal({
  selectedPosting,
  onClose,
  onModerationComplete
}: ModerationQueueModalProps) {
  return (
    <>
      {selectedPosting && (
        <PostingReviewModal
          postingId={selectedPosting}
          onClose={onClose}
          onModerationComplete={onModerationComplete}
        />
      )}
    </>
  );
}