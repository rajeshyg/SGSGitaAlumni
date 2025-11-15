/**
 * Moderation API Validation Schemas
 * 
 * Zod schemas for validating moderation API requests
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

import { z } from 'zod';

/**
 * Schema for approving a posting
 */
export const ApproveRequestSchema = z.object({
  postingId: z.string().uuid('Invalid posting ID format'),
  moderatorNotes: z.string().max(1000, 'Moderator notes must be 1000 characters or less').optional(),
  expiryDate: z.string().datetime('Invalid expiry date format').optional()
});

export type ApproveRequest = z.infer<typeof ApproveRequestSchema>;

/**
 * Schema for rejecting a posting
 */
export const RejectRequestSchema = z.object({
  postingId: z.string().uuid('Invalid posting ID format'),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'DUPLICATE', 'SCAM', 'INCOMPLETE', 'OTHER'], {
    message: 'Invalid rejection reason'
  }),
  feedbackToUser: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(500, 'Feedback must be 500 characters or less'),
  moderatorNotes: z.string().max(1000, 'Moderator notes must be 1000 characters or less').optional()
});

export type RejectRequest = z.infer<typeof RejectRequestSchema>;

/**
 * Schema for escalating a posting to admins
 */
export const EscalateRequestSchema = z.object({
  postingId: z.string().uuid('Invalid posting ID format'),
  escalationReason: z.enum(['SUSPECTED_SCAM', 'POLICY_QUESTION', 'TECHNICAL_ISSUE', 'OTHER'], {
    message: 'Invalid escalation reason'
  }),
  escalationNotes: z.string()
    .min(10, 'Escalation notes must be at least 10 characters')
    .max(1000, 'Escalation notes must be 1000 characters or less')
});

export type EscalateRequest = z.infer<typeof EscalateRequestSchema>;

/**
 * Schema for querying the moderation queue
 */
export const QueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.string().uuid('Invalid domain ID format').optional(),
  status: z.enum(['PENDING', 'ESCALATED'], {
    message: 'Status must be PENDING or ESCALATED'
  }).optional(),
  search: z.string().max(100, 'Search query must be 100 characters or less').optional(),
  sortBy: z.enum(['oldest', 'newest', 'urgent'], {
    message: 'Sort must be oldest, newest, or urgent'
  }).default('oldest')
});

export type QueueQuery = z.infer<typeof QueueQuerySchema>;

/**
 * Schema for updating moderation notes on a posting
 */
export const UpdateNotesSchema = z.object({
  postingId: z.string().uuid('Invalid posting ID format'),
  moderatorNotes: z.string().max(1000, 'Moderator notes must be 1000 characters or less')
});

export type UpdateNotesRequest = z.infer<typeof UpdateNotesSchema>;

/**
 * Helper function to get human-readable rejection reason
 */
export function getRejectionReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    SPAM: 'Spam or unsolicited content',
    INAPPROPRIATE: 'Inappropriate or offensive content',
    DUPLICATE: 'Duplicate posting',
    SCAM: 'Potential scam or fraudulent content',
    INCOMPLETE: 'Incomplete information',
    OTHER: 'Other reason (see feedback)'
  };
  return labels[reason] || reason;
}

/**
 * Helper function to get human-readable escalation reason
 */
export function getEscalationReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    SUSPECTED_SCAM: 'Suspected scam - needs admin review',
    POLICY_QUESTION: 'Policy question - admin guidance needed',
    TECHNICAL_ISSUE: 'Technical issue with posting',
    OTHER: 'Other escalation reason'
  };
  return labels[reason] || reason;
}

/**
 * Helper function to get moderation status badge color
 */
export function getModerationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    ESCALATED: 'info'
  };
  return colors[status] || 'default';
}
