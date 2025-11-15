/**
 * Escalation Form Component
 *
 * Form for escalating a posting to admin review
 */

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LoadingSpinner } from '../ui/loading-spinner';
import type { EscalationReason } from '../../types/moderation';

interface EscalationFormProps {
  escalationReason: EscalationReason;
  onReasonChange: (reason: EscalationReason) => void;
  escalationNotes: string;
  onNotesChange: (notes: string) => void;
  onCancel: () => void;
  onEscalate: () => void;
  actionInProgress: boolean;
}

export function EscalationForm({
  escalationReason,
  onReasonChange,
  escalationNotes,
  onNotesChange,
  onCancel,
  onEscalate,
  actionInProgress
}: EscalationFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Escalation Reason *</label>
        <Select value={escalationReason} onValueChange={(value) => onReasonChange(value as EscalationReason)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUSPECTED_SCAM">Suspected scam - needs admin review</SelectItem>
            <SelectItem value="POLICY_QUESTION">Policy question - admin guidance needed</SelectItem>
            <SelectItem value="TECHNICAL_ISSUE">Technical issue with posting</SelectItem>
            <SelectItem value="OTHER">Other escalation reason</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Escalation Notes * (10-1000 characters)</label>
        <Textarea
          value={escalationNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Explain why this posting needs admin review..."
        />
        <p className="mt-1 text-xs text-muted-foreground">{escalationNotes.length}/1000 characters</p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel} disabled={actionInProgress}>Cancel</Button>
        <Button variant="destructive" onClick={onEscalate} disabled={actionInProgress}>
          {actionInProgress ? <LoadingSpinner size="sm" /> : 'Confirm Escalation'}
        </Button>
      </div>
    </div>
  );
}