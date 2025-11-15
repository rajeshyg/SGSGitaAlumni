/**
 * Approval Form Component
 *
 * Form for approving a posting with optional notes
 */

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { LoadingSpinner } from '../ui/loading-spinner';

interface ApprovalFormProps {
  approvalNotes: string;
  onNotesChange: (notes: string) => void;
  onApprove: () => void;
  onEscalate: () => void;
  onReject: () => void;
  actionInProgress: boolean;
}

export function ApprovalForm({
  approvalNotes,
  onNotesChange,
  onApprove,
  onEscalate,
  onReject,
  actionInProgress
}: ApprovalFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Moderator Notes (Optional)</label>
        <Textarea
          value={approvalNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          placeholder="Internal notes (not visible to user)..."
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onEscalate} disabled={actionInProgress}>Escalate</Button>
        <Button variant="destructive" onClick={onReject} disabled={actionInProgress}>Reject</Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={onApprove} disabled={actionInProgress}>
          {actionInProgress ? <LoadingSpinner size="sm" /> : 'Approve'}
        </Button>
      </div>
    </div>
  );
}