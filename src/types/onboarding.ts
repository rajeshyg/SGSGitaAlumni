/**
 * Onboarding Types
 * Phase 4: UI Refactoring - Types for new onboarding flow
 */

import { UserProfile } from './accounts';

export interface AlumniMatch {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  batch: string;
  centerName: string;
  yearOfBirth: number | null;
  age: number | null;
  coppaStatus: 'blocked' | 'requires_consent' | 'full_access' | 'unknown';
  canCreateProfile: boolean;
}

export interface ProfileSelection {
  alumniMemberId: number;
  relationship: 'parent' | 'child';
  yearOfBirth?: number;
}

export type OnboardingStep = 'select_profiles' | 'collect_yob' | 'consent' | 'complete';

export interface OnboardingState {
  step: OnboardingStep;
  alumniMatches: AlumniMatch[];
  selections: ProfileSelection[];
  profilesNeedingYob: AlumniMatch[];
  profilesNeedingConsent: UserProfile[];
}

export interface InvitationValidation {
  valid: boolean;
  invitation: {
    id: string;
    email: string;
    expiresAt: string;
  };
  alumni: AlumniMatch[];
}

export interface ProfileSelectionResponse {
  success: boolean;
  profiles: UserProfile[];
  requiresConsent: boolean;
  needsYobCollection: boolean;
}

export interface YobCollectionRequest {
  alumniMemberId: number;
  yearOfBirth: number;
}

export interface ConsentRequest {
  childProfileId: string;
  verificationMethod: 'id_verification' | 'credit_card' | 'other';
}
