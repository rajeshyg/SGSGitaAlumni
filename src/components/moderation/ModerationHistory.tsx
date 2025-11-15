/**
 * Moderation History Component
 *
 * Displays the moderation history for a posting
 */

import type { ModerationHistoryItem } from '../../types/moderation';

interface ModerationHistoryProps {
  history: ModerationHistoryItem[];
}

export function ModerationHistory({ history }: ModerationHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-3">Moderation History</h4>
      <div className="bg-accent rounded-lg p-4 space-y-3">
        {history.map((item) => (
          <div key={item.id} className="border-l-2 border-border pl-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">{item.action}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              by {item.moderator_first_name} {item.moderator_last_name}
            </p>
            {item.feedback_to_user && (
              <p className="mt-1 text-sm text-foreground">{item.feedback_to_user}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}