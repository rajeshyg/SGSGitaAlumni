/**
 * Account and Profile Types
 * Phase 4: UI Refactoring - New type definitions for accounts and user_profiles tables
 */

export interface Account {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  requiresOtp: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  accountId: string;
  alumniMemberId: number;
  relationship: 'parent' | 'child';
  parentProfileId: string | null;
  
  // From alumni_members (joined in API responses)
  firstName?: string;
  lastName?: string;
  batch?: number;
  centerName?: string;
  yearOfBirth?: number | null;
  email?: string;
  phone?: string;
  
  // Profile customization (overrides alumni data)
  displayName: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  currentPosition: string | null;
  company: string | null;
  location: string | null;
  
  // COPPA Compliance (for children 14-17)
  requiresConsent: boolean;
  parentConsentGiven: boolean;
  parentConsentDate: string | null;
  consentExpiresAt: string | null;
  
  // Access control
  accessLevel: 'full' | 'supervised' | 'blocked';
  status: 'active' | 'pending_consent' | 'suspended';
  
  // Activity
  lastActiveAt: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface SessionState {
  accountId: string;
  email: string;
  profiles: UserProfile[];
  activeProfileId: string | null;
  activeProfile?: UserProfile;
}

export interface ParentConsentRecord {
  id: string;
  childProfileId: string;
  parentProfileId: string;
  consentGivenAt: string;
  consentExpiresAt: string;
  verificationMethod: 'id_verification' | 'credit_card' | 'other';
  ipAddress: string;
  userAgent: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
}
