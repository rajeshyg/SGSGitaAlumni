/**
 * Moderation Type Definitions
 * 
 * TypeScript types for the moderation system
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

export interface QueuePosting {
  id: string;
  title: string;
  description: string;
  posting_type: string;
  domain_id: string;
  domain_name: string;
  moderation_status: 'PENDING' | 'ESCALATED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  expires_at: string | null;
  version: number;
  first_name: string;
  last_name: string;
  submitter_email: string;
  submitter_id: string;
  moderation_count: number;
  submitter_rejection_count: number;
}

export interface QueueStats {
  pending_count: number;
  escalated_count: number;
  urgent_count: number;
}

export interface QueueFiltersType {
  page: number;
  limit: number;
  domain?: string;
  status?: 'PENDING' | 'ESCALATED';
  search: string;
  sortBy: 'oldest' | 'newest' | 'urgent';
}

export interface PostingDetail extends QueuePosting {
  submitter_joined_date: string;
}

export interface SubmitterStats {
  total_postings: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
}

export interface ModerationHistoryItem {
  id: string;
  posting_id: string;
  moderator_id: string;
  action: 'APPROVED' | 'REJECTED' | 'ESCALATED';
  reason: string | null;
  feedback_to_user: string | null;
  moderator_notes: string | null;
  created_at: string;
  moderator_first_name: string;
  moderator_last_name: string;
}

export type RejectionReason = 
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'DUPLICATE'
  | 'SCAM'
  | 'INCOMPLETE'
  | 'OTHER';

export type EscalationReason =
  | 'SUSPECTED_SCAM'
  | 'POLICY_QUESTION'
  | 'TECHNICAL_ISSUE'
  | 'OTHER';

export interface ApproveRequest {
  postingId: string;
  moderatorNotes?: string;
  expiryDate?: string;
}

export interface RejectRequest {
  postingId: string;
  reason: RejectionReason;
  feedbackToUser: string;
  moderatorNotes?: string;
}

export interface EscalateRequest {
  postingId: string;
  escalationReason: EscalationReason;
  escalationNotes: string;
}
