// ============================================================================
// NEW CONVERSATION DIALOG COMPONENT
// ============================================================================
// Modal dialog for creating new DIRECT or GROUP conversations
// Integrates UserPicker for participant selection

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription } from '../ui/alert';
import { MessageSquare, Users, Loader2 } from 'lucide-react';
import { UserPicker } from './UserPicker';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface NewConversationDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Callback when conversation is successfully created */
  onConversationCreated?: (conversationId: string) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onConversationCreated,
}) => {
  const { user } = useAuth();
  const [conversationType, setConversationType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    // Validation
    if (selectedUserIds.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    if (conversationType === 'DIRECT' && selectedUserIds.length > 1) {
      setError('Direct conversations can only have one other participant');
      return;
    }

    if (conversationType === 'GROUP') {
      if (!groupName.trim()) {
        setError('Please enter a group name');
        return;
      }
      if (selectedUserIds.length < 2) {
        setError('Group conversations require at least 2 participants');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload: {
        type: 'DIRECT' | 'GROUP';
        participantIds: string[];
        name?: string;
      } = {
        type: conversationType,
        participantIds: selectedUserIds,
      };

      if (conversationType === 'GROUP') {
        payload.name = groupName.trim();
      }

      const response = await apiClient.post('/api/conversations', payload);
      
      // Extract conversation ID from response
      const conversationId = response.data?.id || response.id;

      // Reset form
      handleReset();

      // Close dialog
      onOpenChange(false);

      // Notify parent component
      if (onConversationCreated && conversationId) {
        onConversationCreated(conversationId);
      }
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      setError(err.message || 'Failed to create conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConversationType('DIRECT');
    setGroupName('');
    setSelectedUserIds([]);
    setError(null);
  };

  const handleCancel = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Create a new direct message or group conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Conversation Type Selector */}
          <div className="space-y-3">
            <Label htmlFor="conversation-type">Conversation Type</Label>
            <RadioGroup
              id="conversation-type"
              value={conversationType}
              onValueChange={(value) => {
                setConversationType(value as 'DIRECT' | 'GROUP');
                setSelectedUserIds([]);
                setError(null);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DIRECT" id="direct" />
                <Label htmlFor="direct" className="flex items-center gap-2 cursor-pointer font-normal">
                  <MessageSquare className="h-4 w-4" />
                  Direct Message (1-on-1)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="GROUP" id="group" />
                <Label htmlFor="group" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Users className="h-4 w-4" />
                  Group Conversation (2+ participants)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Group Name Input (only for GROUP type) */}
          {conversationType === 'GROUP' && (
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {groupName.length}/200 characters
              </p>
            </div>
          )}

          {/* Participant Selector */}
          <div className="space-y-2">
            <Label>
              {conversationType === 'DIRECT' ? 'Select Participant' : 'Select Participants'}
            </Label>
            <UserPicker
              multiple={conversationType === 'GROUP'}
              selectedUserIds={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
              excludeUserIds={user?.id ? [user.id] : []}
              maxSelection={50}
              placeholder={
                conversationType === 'DIRECT'
                  ? 'Search for a user to message...'
                  : 'Search and select multiple users...'
              }
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || selectedUserIds.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Create Conversation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
