/**
 * Zod Validation Schemas
 * Shared between frontend and backend for type safety and consistency
 * 
 * @module schemas/validation
 */

import { z } from 'zod';

// ============================================
// REUSABLE BASE SCHEMAS
// ============================================

export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

export const UUIDSchema = z
  .string()
  .uuid('Invalid UUID format');

export const DateSchema = z
  .string()
  .datetime('Invalid datetime format')
  .or(z.date());

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  invitationToken: z.string().min(1, 'Invitation token required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const OTPGenerateSchema = z.object({
  email: EmailSchema,
  type: z.enum(['TOTP', 'SMS', 'EMAIL', 'email', 'login', 'registration', 'password_reset']).optional()
});

export type OTPGenerateInput = z.infer<typeof OTPGenerateSchema>;

export const OTPVerifySchema = z.object({
  email: EmailSchema,
  otpCode: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  tokenType: z.enum(['login', 'registration', 'password_reset', 'email']).optional()
});

export type OTPVerifyInput = z.infer<typeof OTPVerifySchema>;

// ============================================
// INVITATION SCHEMAS
// ============================================

export const InvitationCreateSchema = z.object({
  inviteeEmail: EmailSchema,
  inviteeFirstName: z.string().min(1).max(100),
  inviteeLastName: z.string().min(1).max(100),
  relationship: z.enum(['SELF', 'CHILD', 'SIBLING', 'SPOUSE', 'PARENT', 'OTHER']),
  isParentInvitation: z.boolean(),
  parentConsentRequired: z.boolean(),
  expiresInDays: z.number().int().min(1).max(365).default(30)
});

export type InvitationCreateInput = z.infer<typeof InvitationCreateSchema>;

export const InvitationAcceptSchema = z.object({
  token: z.string().min(1, 'Invitation token required')
});

export type InvitationAcceptInput = z.infer<typeof InvitationAcceptSchema>;

// ============================================
// FAMILY MEMBER SCHEMAS
// ============================================

export const FamilyMemberCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: DateSchema,
  relationship: z.enum(['SELF', 'CHILD', 'SIBLING', 'SPOUSE', 'PARENT', 'OTHER']),
  isMinor: z.boolean(),
  requiresParentConsent: z.boolean()
});

export type FamilyMemberCreateInput = z.infer<typeof FamilyMemberCreateSchema>;

export const FamilyMemberConsentSchema = z.object({
  consentGiven: z.boolean(),
  consentDate: DateSchema,
  parentEmail: EmailSchema.optional(),
  expiresAt: DateSchema.optional()
});

export type FamilyMemberConsentInput = z.infer<typeof FamilyMemberConsentSchema>;

// ============================================
// POSTING SCHEMAS
// ============================================

// Task 7.7.9: Enhanced expiry date schema with 30-day minimum and 1-year maximum
export const PostingExpiryDateSchema = z
  .string()
  .datetime('Invalid datetime format')
  .or(z.date())
  .refine((date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const minDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    return d >= minDate;
  }, {
    message: 'Expiry date must be at least 30 days from now'
  })
  .refine((date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    return d <= maxDate;
  }, {
    message: 'Expiry date cannot be more than 1 year in the future'
  })
  .optional();

export const PostingCreateSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long'),
  description: z.string().min(20, 'Description too short').max(5000, 'Description too long'),
  domainId: UUIDSchema,
  categoryId: UUIDSchema,
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed'),
  expiryDate: PostingExpiryDateSchema, // Use enhanced schema with 30-day minimum
  isUrgent: z.boolean().default(false),
  contactMethod: z.enum(['EMAIL', 'PHONE', 'CHAT', 'ALL']).default('EMAIL')
});

export type PostingCreateInput = z.infer<typeof PostingCreateSchema>;

export const PostingModerationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ESCALATE']),
  reason: z.string().max(500).optional(),
  moderatorNotes: z.string().max(1000).optional()
});

export type PostingModerationInput = z.infer<typeof PostingModerationSchema>;

// ============================================
// USER PROFILE SCHEMAS
// ============================================

export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: PhoneSchema,
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  linkedInUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional()
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

export const PreferencesUpdateSchema = z.object({
  primary_domain_id: UUIDSchema.optional(),
  secondary_domain_ids: z.array(UUIDSchema).max(3, 'Maximum 3 secondary domains allowed').optional(),
  areas_of_interest_ids: z.array(UUIDSchema).max(20, 'Maximum 20 areas of interest allowed').optional(),
  preference_type: z.enum(['seeking', 'offering', 'both']).optional(),
  max_postings: z.number().int().min(1).max(10).optional(),
  notification_settings: z.record(z.any()).optional(),
  privacy_settings: z.record(z.any()).optional(),
  interface_settings: z.record(z.any()).optional(),
  is_professional: z.boolean().optional(),
  education_status: z.enum(['student', 'professional', 'both']).optional()
});

export type PreferencesUpdateInput = z.infer<typeof PreferencesUpdateSchema>;

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const PostingFilterSchema = z.object({
  domainId: UUIDSchema.optional(),
  categoryId: UUIDSchema.optional(),
  search: z.string().max(200).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  ...PaginationSchema.shape
});

export type PostingFilterInput = z.infer<typeof PostingFilterSchema>;

// ============================================
// CHAT & MESSAGING SCHEMAS (Task 7.10)
// ============================================

export const ConversationTypeSchema = z.enum(['DIRECT', 'GROUP', 'POST_LINKED']);

export const MessageTypeSchema = z.enum(['TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM']);

// Create Conversation Schema
export const CreateConversationSchema = z.object({
  type: ConversationTypeSchema,
  name: z.string().min(1).max(200).optional(), // Required for GROUP, optional for others
  postingId: UUIDSchema.optional(), // Required for POST_LINKED
  participantIds: z.array(z.number().int()).min(1).max(50) // 1-50 participants
}).refine(data => {
  // GROUP conversations must have a name
  if (data.type === 'GROUP' && !data.name) {
    return false;
  }
  // POST_LINKED conversations must have a postingId
  if (data.type === 'POST_LINKED' && !data.postingId) {
    return false;
  }
  return true;
}, {
  message: 'Invalid conversation configuration for type'
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

// Send Message Schema
export const SendMessageSchema = z.object({
  conversationId: UUIDSchema,
  content: z.string().min(1).max(10000), // 10k chars max
  messageType: MessageTypeSchema.default('TEXT'),
  mediaUrl: z.string().url().max(500).optional(),
  mediaMetadata: z.object({
    fileName: z.string().max(255).optional(),
    fileSize: z.number().int().positive().optional(),
    mimeType: z.string().max(100).optional()
  }).optional(),
  replyToId: UUIDSchema.optional() // For threaded replies
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// Edit Message Schema
export const EditMessageSchema = z.object({
  messageId: UUIDSchema,
  content: z.string().min(1).max(10000)
});

export type EditMessageInput = z.infer<typeof EditMessageSchema>;

// Add Reaction Schema
export const AddReactionSchema = z.object({
  messageId: UUIDSchema,
  emoji: z.string().min(1).max(10) // Support multi-character emojis
});

export type AddReactionInput = z.infer<typeof AddReactionSchema>;

// Add Participant Schema
export const AddParticipantSchema = z.object({
  conversationId: UUIDSchema,
  userId: z.number().int(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER')
});

export type AddParticipantInput = z.infer<typeof AddParticipantSchema>;

// Get Messages Schema (pagination + filters)
export const GetMessagesSchema = z.object({
  conversationId: UUIDSchema,
  ...PaginationSchema.shape,
  before: DateSchema.optional(), // Get messages before this timestamp
  after: DateSchema.optional() // Get messages after this timestamp
});

export type GetMessagesInput = z.infer<typeof GetMessagesSchema>;

// Mark as Read Schema
export const MarkAsReadSchema = z.object({
  conversationId: UUIDSchema,
  messageId: UUIDSchema.optional() // If omitted, mark all messages in conversation as read
});

export type MarkAsReadInput = z.infer<typeof MarkAsReadSchema>;
