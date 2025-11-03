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

export const PostingCreateSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long'),
  description: z.string().min(20, 'Description too short').max(5000, 'Description too long'),
  domainId: UUIDSchema,
  categoryId: UUIDSchema,
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed'),
  expiryDate: DateSchema.optional(),
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
  selectedDomains: z.array(UUIDSchema).min(1).max(5, 'Maximum 5 domains allowed'),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  privacyLevel: z.enum(['PUBLIC', 'ALUMNI_ONLY', 'PRIVATE'])
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
