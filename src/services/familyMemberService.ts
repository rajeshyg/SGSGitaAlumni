/**
 * User Profiles API Service
 * 
 * MIGRATED: Updated from family members to user_profiles schema
 * Client-side service for interacting with user profile endpoints
 */

import { apiClient } from '../lib/api';
import type { UserProfile } from '../types/accounts';

// ============================================================================
// TYPE EXPORTS (For backward compatibility)
// ============================================================================

/**
 * @deprecated Use UserProfile from '../types/accounts' instead
 * FamilyMember is now an alias for UserProfile with additional computed fields
 */
export interface FamilyMember extends UserProfile {
  // Computed fields for backward compatibility
  display_name?: string;
  first_name?: string;
  last_name?: string;
  current_age?: number;
  birth_date?: string;
  profile_image_url?: string;
  current_center?: string;
  is_primary_contact?: boolean;
  consent_renewal_required?: boolean;
  requires_parent_consent?: boolean;
  parent_consent_given?: boolean;
}

/**
 * @deprecated Use proper API params instead
 */
export interface ConsentData {
  childProfileId: string;
  verificationMethod?: 'id_verification' | 'credit_card' | 'other';
}

/**
 * @deprecated Use proper API params instead
 */
export interface CreateFamilyMemberRequest {
  firstName: string;
  lastName: string;
  displayName?: string;
  yearOfBirth?: string;
  relationship?: 'parent' | 'child';
  currentCenter?: string;
  profileImageUrl?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all user profiles for the authenticated account
 */
export async function getProfiles(): Promise<UserProfile[]> {
  const response = await apiClient.get('/api/family-members');
  // Backend returns { success: true, data: profiles }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as UserProfile[];
  }
  return response as UserProfile[];
}

/**
 * @deprecated Use getProfiles instead
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const profiles = await getProfiles();
  // Map to FamilyMember format for backward compatibility
  return profiles.map(p => ({
    ...p,
    display_name: p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    first_name: p.firstName,
    last_name: p.lastName,
    current_age: p.yearOfBirth ? new Date().getFullYear() - p.yearOfBirth : undefined,
    is_primary_contact: p.relationship === 'parent',
    consent_renewal_required: p.consentExpiresAt ? new Date(p.consentExpiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false,
    requires_parent_consent: p.requiresConsent,
    parent_consent_given: p.parentConsentGiven
  }));
}

/**
 * Get a specific user profile by ID
 */
export async function getProfile(id: string): Promise<UserProfile> {
  const response = await apiClient.get(`/api/family-members/${id}`);
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as UserProfile;
  }
  return response as UserProfile;
}

/**
 * Switch to a different user profile (session-based, no DB persistence)
 */
export async function switchProfile(profileId: string): Promise<{ success: boolean; activeProfile: UserProfile; token?: string; refreshToken?: string }> {
  const response = await apiClient.post(`/api/family-members/${profileId}/switch`, {});
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as { success: boolean; activeProfile: UserProfile; token?: string; refreshToken?: string };
  }
  return response as { success: boolean; activeProfile: UserProfile; token?: string; refreshToken?: string };
}

/**
 * Grant parent consent for a minor (14-17)
 */
export async function grantConsent(childProfileId: string): Promise<{ success: boolean; expiresAt: string }> {
  const response = await apiClient.post('/api/onboarding/grant-consent', { childProfileId });
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as { success: boolean; expiresAt: string };
  }
  return response as { success: boolean; expiresAt: string };
}

/**
 * Revoke parent consent
 */
export async function revokeConsent(childProfileId: string, reason?: string): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/api/family-members/${childProfileId}/consent/revoke`, { reason });
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as { success: boolean };
  }
  return response as { success: boolean };
}

// ============================================================================
// DEPRECATED STUBS (For backward compatibility - will be removed)
// ============================================================================

/**
 * @deprecated Access logs feature removed - returns empty array
 */
export interface AccessLog {
  id: string;
  profileId: string;
  action: string;
  timestamp: string;
  ipAddress?: string;
}

/**
 * @deprecated Access logs feature removed - returns empty array
 */
export async function getAccessLogs(): Promise<AccessLog[]> {
  console.warn('[familyMemberService] getAccessLogs is deprecated and returns empty array');
  return [];
}

/**
 * @deprecated Profile deletion should go through proper onboarding flow
 */
export async function deleteFamilyMember(profileId: string): Promise<{ success: boolean }> {
  console.warn('[familyMemberService] deleteFamilyMember is deprecated');
  const response = await apiClient.delete(`/api/family-members/${profileId}`);
  if (response && typeof response === 'object' && 'success' in response) {
    return response as { success: boolean };
  }
  return { success: true };
}
