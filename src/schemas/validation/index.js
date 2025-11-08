/**
 * Zod Validation Schemas (JavaScript version for Node.js server)
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
  .refine(
    (val) => val === '' || /^\+?[1-9]\d{1,14}$/.test(val),
    'Invalid phone number format'
  )
  .optional();

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().optional(), // Optional because OTP-verified logins don't need password
  rememberMe: z.boolean().optional(),
  otpVerified: z.boolean().optional()
}).refine(
  (data) => {
    // If OTP is not verified, password is required
    if (!data.otpVerified) {
      return data.password && data.password.length > 0;
    }
    // If OTP is verified, password is not required
    return true;
  },
  {
    message: 'Password is required for traditional login',
    path: ['password'] // Show error on password field
  }
);

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

export const OTPGenerateSchema = z.object({
  email: EmailSchema,
  type: z.enum(['TOTP', 'SMS', 'EMAIL', 'email', 'login', 'registration', 'password_reset']).optional()
});

export const OTPVerifySchema = z.object({
  email: EmailSchema,
  otpCode: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  tokenType: z.enum(['login', 'registration', 'password_reset', 'email']).optional()
});

// ============================================
// INVITATION SCHEMAS
// ============================================

export const InvitationCreateSchema = z.object({
  inviteeEmail: EmailSchema,
  inviteeFirstName: z.string().min(1).max(100),
  inviteeLastName: z.string().min(1).max(100),
  relationship: z.enum(['SELF', 'CHILD', 'SIBLING', 'SPOUSE', 'PARENT', 'OTHER']),
  isParentInvitation: z.boolean().optional(),
  parentConsentRequired: z.boolean().optional(),
  expiresInDays: z.number().int().min(1).max(365).default(30).optional()
});

export const InvitationAcceptSchema = z.object({
  token: z.string().min(1, 'Invitation token required')
});

// ============================================
// FAMILY MEMBER SCHEMAS
// ============================================

export const FamilyMemberCreateSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
  displayName: z.string().max(100, 'Display name too long').optional(),
  birthDate: z.string().optional(), // ISO date string or null
  relationship: z.enum(['SELF', 'CHILD', 'SIBLING', 'SPOUSE', 'PARENT', 'OTHER']).optional(),
  profileImageUrl: z.string().url('Invalid profile image URL').optional()
});

export const FamilyMemberUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional(),
  birthDate: z.string().optional(),
  relationship: z.enum(['SELF', 'CHILD', 'SIBLING', 'SPOUSE', 'PARENT', 'OTHER']).optional(),
  profileImageUrl: z.string().url().optional()
});

export const FamilyMemberConsentSchema = z.object({
  consentGiven: z.boolean(),
  consentDate: DateSchema,
  parentEmail: EmailSchema.optional(),
  expiresAt: DateSchema.optional()
});

// ============================================
// POSTING SCHEMAS
// ============================================

export const PostingCreateSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200, 'Title too long'),
  content: z.string().min(20, 'Content too short').max(5000, 'Content too long'),
  posting_type: z.enum(['offer_support', 'seek_support']),
  category_id: UUIDSchema.optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  contact_name: z.string().min(1, 'Contact name required').max(100),
  contact_email: EmailSchema,
  contact_phone: PhoneSchema,
  contact_country: z.string().max(100).default('USA'),
  location: z.string().max(200).optional(),
  location_type: z.enum(['remote', 'in-person', 'hybrid']).default('remote'),
  duration: z.string().max(100).optional(),
  max_connections: z.number().int().min(1).max(100).default(5),
  domain_ids: z.array(UUIDSchema).max(10, 'Maximum 10 domains allowed').default([]),
  tag_ids: z.array(UUIDSchema).max(10, 'Maximum 10 tags allowed').default([]),
  expires_at: z.string().datetime().optional()
});

export const PostingUpdateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(20).max(5000).optional(),
  category_id: UUIDSchema.optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  contact_name: z.string().min(1).max(100).optional(),
  contact_email: EmailSchema.optional(),
  contact_phone: PhoneSchema,
  location: z.string().max(200).optional(),
  location_type: z.enum(['remote', 'in-person', 'hybrid']).optional(),
  duration: z.string().max(100).optional(),
  max_connections: z.number().int().min(1).max(100).optional(),
  domain_ids: z.array(UUIDSchema).max(10, 'Maximum 10 domains allowed').optional(),
  tag_ids: z.array(UUIDSchema).max(10, 'Maximum 10 tags allowed').optional(),
  expires_at: z.string().datetime().optional()
});

export const PostingModerationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ESCALATE']),
  reason: z.string().max(500).optional(),
  moderatorNotes: z.string().max(1000).optional()
});

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

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const PostingFilterSchema = z.object({
  domainId: UUIDSchema.optional(),
  categoryId: UUIDSchema.optional(),
  search: z.string().max(200).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  ...PaginationSchema.shape
});
