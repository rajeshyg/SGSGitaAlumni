// ============================================================================
// INVITATION SYSTEM TYPE DEFINITIONS
// ============================================================================
// TypeScript interfaces for the invitation-based authentication system

// ============================================================================
// CORE INVITATION TYPES
// ============================================================================

export interface Invitation {
  id: string;
  email: string;
  invitationToken: string;
  invitedBy: string;
  invitationType: InvitationType;
  invitationData?: InvitationData;
  status: InvitationStatus;
  sentAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  acceptedBy?: string;
  ipAddress?: string;
  resendCount: number;
  lastResentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InvitationType = 'alumni' | 'family_member' | 'admin';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface InvitationData {
  graduationYear?: number;
  program?: string;
  relationship?: string;
  expectedProfiles?: number;
  specialInstructions?: string;
}

// ============================================================================
// OTP SYSTEM TYPES
// ============================================================================

export interface OTPToken {
  id: string;
  email: string;
  otpCode: string;
  tokenType: OTPType;
  userId?: string;
  generatedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  ipAddress?: string;
  attemptCount: number;
  lastAttemptAt?: Date;
  createdAt: Date;
}

export type OTPType = 'login' | 'registration' | 'password_reset';

export interface OTPValidation {
  isValid: boolean;
  token: OTPToken | null;
  remainingAttempts: number;
  errors: string[];
  isExpired: boolean;
  isRateLimited: boolean;
}

// ============================================================================
// FAMILY INVITATION TYPES
// ============================================================================

export interface FamilyInvitation {
  id: string;
  parentEmail: string;
  childrenProfiles: ChildProfile[];
  invitationToken: string;
  status: FamilyInvitationStatus;
  sentAt: Date;
  expiresAt: Date;
  acceptanceLog?: AcceptanceLogEntry[];
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FamilyInvitationStatus = 'pending' | 'partially_accepted' | 'completed';

export interface ChildProfile {
  id: string;
  name: string;
  graduationYear: number;
  program: string;
  isAvailable: boolean;
  isAccepted?: boolean;
  acceptedAt?: Date;
}

export interface AcceptanceLogEntry {
  childProfileId: string;
  acceptedAt: Date;
  acceptedBy: string;
  ipAddress?: string;
}

export interface ProfileSelection {
  childProfileId: string;
  parentEmail: string;
  registrationData: UserRegistrationData;
}

// ============================================================================
// AGE VERIFICATION TYPES
// ============================================================================

export interface AgeVerification {
  id: string;
  userId: string;
  birthDate: Date;
  ageAtRegistration: number;
  requiresParentConsent: boolean;
  parentConsentCollected: boolean;
  parentEmail?: string;
  consentTimestamp?: Date;
  consentIpAddress?: string;
  verificationMethod: VerificationMethod;
  createdAt: Date;
  updatedAt: Date;
}

export type VerificationMethod = 'self_reported' | 'document_verified';

export interface AgeVerificationResult {
  isValid: boolean;
  age: number;
  requiresParentConsent: boolean;
  isMinorWithoutConsent: boolean;
  errors: string[];
}

export interface ParentConsentRecord {
  id: string;
  childUserId: string;
  parentEmail: string;
  consentToken: string;
  consentGiven: boolean;
  consentTimestamp?: Date;
  consentIpAddress?: string;
  consentUserAgent?: string;
  digitalSignature?: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface InvitationRequest {
  email: string;
  type: InvitationType;
  invitedBy: string;
  data?: InvitationData;
  expiresInDays?: number; // Default: 7 days
}

export interface InvitationValidation {
  isValid: boolean;
  invitation: Invitation | null;
  errors: string[];
  requiresParentConsent: boolean;
  isExpired: boolean;
  isAlreadyUsed: boolean;
}

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  birthDate: Date;
  graduationYear: number;
  program: string;
  currentPosition?: string;
  bio?: string;
  parentEmail?: string; // Required if under 18
  parentConsentToken?: string;
}

export interface OTPRequest {
  email: string;
  type: OTPType;
  userId?: string;
}

export interface OTPVerificationRequest {
  email: string;
  otpCode: string;
  type: OTPType;
}

export interface FamilyInvitationRequest {
  parentEmail: string;
  childrenData: ChildProfile[];
  invitedBy: string;
  expiresInDays?: number; // Default: 7 days
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailDeliveryLog {
  id: string;
  emailType: EmailType;
  recipientEmail: string;
  subject?: string;
  templateId?: string;
  deliveryStatus: EmailDeliveryStatus;
  externalMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
}

export type EmailType = 'invitation' | 'otp' | 'family_invitation' | 'parent_consent';
export type EmailDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface InvitationAuditLog {
  id: string;
  invitationId?: string;
  action: InvitationAction;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
  timestamp: Date;
}

export type InvitationAction = 'created' | 'sent' | 'resent' | 'accepted' | 'expired' | 'revoked';

// ============================================================================
// SERVICE INTERFACE TYPES
// ============================================================================

export interface InvitationServiceInterface {
  createInvitation(request: InvitationRequest): Promise<Invitation>;
  sendInvitation(invitationId: string): Promise<void>;
  validateInvitation(token: string): Promise<InvitationValidation>;
  acceptInvitation(token: string, userData: UserRegistrationData): Promise<User>;
  resendInvitation(invitationId: string): Promise<void>;
  revokeInvitation(invitationId: string): Promise<void>;
  getInvitationStatus(token: string): Promise<Invitation>;
  listInvitations(filters?: InvitationFilters): Promise<Invitation[]>;
}

export interface OTPServiceInterface {
  generateOTP(request: OTPRequest): Promise<OTPToken>;
  sendOTP(email: string, otpCode: string, type: OTPType): Promise<void>;
  validateOTP(request: OTPVerificationRequest): Promise<OTPValidation>;
  isOTPRequired(userId: string): Promise<boolean>;
  getRemainingOTPAttempts(email: string): Promise<number>;
  resetDailyOTPLimit(email: string): Promise<void>;
  cleanupExpiredOTPs(): Promise<void>;
}

export interface FamilyInvitationServiceInterface {
  createFamilyInvitation(request: FamilyInvitationRequest): Promise<FamilyInvitation>;
  sendFamilyInvitation(invitationId: string): Promise<void>;
  getAvailableProfiles(token: string): Promise<ChildProfile[]>;
  selectChildProfile(token: string, profileId: string): Promise<ProfileSelection>;
  completeFamilyRegistration(selections: ProfileSelection[]): Promise<User[]>;
}

export interface AgeVerificationServiceInterface {
  verifyAge(birthDate: Date): Promise<AgeVerificationResult>;
  requiresParentConsent(age: number): boolean;
  collectParentConsent(parentEmail: string, childData: UserRegistrationData): Promise<ParentConsentRecord>;
  validateParentConsent(consentToken: string): Promise<boolean>;
  renewParentConsent(consentId: string): Promise<ParentConsentRecord>;
}

// ============================================================================
// FILTER AND PAGINATION TYPES
// ============================================================================

export interface InvitationFilters {
  status?: InvitationStatus;
  type?: InvitationType;
  invitedBy?: string;
  email?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class InvitationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'InvitationError';
  }
}

export class OTPError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'OTPError';
  }
}

export class AgeVerificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AgeVerificationError';
  }
}

// Re-export User type from existing auth types
export type { User } from './auth';
