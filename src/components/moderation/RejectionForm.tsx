/**
 * Rejection Form Component
 *
 * Form for rejecting a posting with reason and feedback
 */

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading-spinner';
import type { RejectionReason } from '../../types/moderation';

interface RejectionFormProps {
  rejectionReason: RejectionReason;
  onReasonChange: (reason: RejectionReason) => void;
  rejectionFeedback: string;
  onFeedbackChange: (feedback: string) => void;
  rejectionNotes: string;
  onNotesChange: (notes: string) => void;
  onCancel: () => void;
  onReject: () => void;
  actionInProgress: boolean;
}

const ReasonSelect = ({ value, onChange }: { value: RejectionReason; onChange: (reason: RejectionReason) => void }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">Rejection Reason *</label>
    <Select value={value} onValueChange={(value) => onChange(value as RejectionReason)}>
      <SelectTrigger>
        <SelectValue placeholder="Select a reason" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="SPAM">Spam or unsolicited content</SelectItem>
        <SelectItem value="INAPPROPRIATE">Inappropriate or offensive content</SelectItem>
        <SelectItem value="DUPLICATE">Duplicate posting</SelectItem>
        <SelectItem value="SCAM">Potential scam or fraudulent content</SelectItem>
        <SelectItem value="INCOMPLETE">Incomplete information</SelectItem>
        <SelectItem value="OTHER">Other reason</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const FeedbackTextarea = ({ value, onChange }: { value: string; onChange: (feedback: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">Feedback to User * (10-500 characters)</label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      maxLength={500}
      placeholder="Explain why this posting was rejected..."
    />
    <p className="mt-1 text-xs text-muted-foreground">{value.length}/500 characters</p>
  </div>
);

const NotesTextarea = ({ value, onChange }: { value: string; onChange: (notes: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">Internal Notes (Optional)</label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder="Internal moderator notes..."
    />
  </div>
);

const ActionButtons = ({ onCancel, onReject, actionInProgress }: {
  onCancel: () => void;
  onReject: () => void;
  actionInProgress: boolean;
}) => (
  <div className="flex justify-end space-x-2">
    <Button variant="ghost" onClick={onCancel} disabled={actionInProgress}>Cancel</Button>
    <Button variant="destructive" onClick={onReject} disabled={actionInProgress}>
      {actionInProgress ? <LoadingSpinner size="sm" /> : 'Confirm Rejection'}
    </Button>
  </div>
);

export function RejectionForm(props: RejectionFormProps) {
  return (
    <div className="space-y-4">
      <ReasonSelect value={props.rejectionReason} onChange={props.onReasonChange} />
      <FeedbackTextarea value={props.rejectionFeedback} onChange={props.onFeedbackChange} />
      <NotesTextarea value={props.rejectionNotes} onChange={props.onNotesChange} />
      <ActionButtons
        onCancel={props.onCancel}
        onReject={props.onReject}
        actionInProgress={props.actionInProgress}
      />
    </div>
  );
}