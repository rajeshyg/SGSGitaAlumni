/**
 * Centralized Type Exports
 * Phase 4: UI Refactoring
 */

// Account & Profile types
export * from './accounts';
export type { Account, UserProfile, SessionState, ParentConsentRecord } from './accounts';

// Onboarding types
export * from './onboarding';
export type { 
  AlumniMatch, 
  ProfileSelection, 
  OnboardingStep,
  OnboardingState,
  InvitationValidation,
  ProfileSelectionResponse,
  YobCollectionRequest,
  ConsentRequest
} from './onboarding';

// Existing types
export * from './dashboard';
export * from './directory';
export * from './invitation';
export * from './moderation';
