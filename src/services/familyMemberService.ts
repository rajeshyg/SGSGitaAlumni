/**
 * Family Members API Service
 * 
 * Client-side service for interacting with family member endpoints
 */

import { apiClient } from '../lib/api';

export interface FamilyMember {
  id: string;
  parent_user_id: number;
  alumni_member_id?: number;
  first_name: string;
  last_name: string;
  display_name: string;
  birth_date?: string;
  current_age?: number;
  can_access_platform: boolean;
  requires_parent_consent: boolean;
  parent_consent_given: boolean;
  parent_consent_date?: string;
  consent_renewal_required?: boolean;
  access_level: 'full' | 'supervised' | 'blocked';
  relationship: 'self' | 'child' | 'spouse' | 'sibling' | 'guardian';
  is_primary_contact: boolean;
  profile_image_url?: string;
  current_center?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_consent';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CreateFamilyMemberRequest extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  displayName?: string;
  birthDate?: string;
  relationship?: 'child' | 'spouse' | 'sibling' | 'guardian';
  profileImageUrl?: string;
  currentCenter?: string;
}

export interface UpdateFamilyMemberRequest extends Record<string, unknown> {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImageUrl?: string;
  currentCenter?: string;
  bio?: string;
}

export interface ConsentData {
  digitalSignature: string | null;
  termsAccepted: boolean;
  termsVersion: string;
}

export interface AccessLog {
  id: string;
  family_member_id: string;
  parent_user_id: number;
  action: string;
  access_type: 'login' | 'profile_switch' | 'logout';
  accessed_at: string;
  access_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  details?: string;
  first_name: string;
  last_name: string;
  display_name: string;
}

/**
 * Get all family members for the authenticated user
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const response = await apiClient.get('/api/family-members');
  // Backend returns { success: true, data: members }
  // apiClient.get returns the full response, so we need response.data or response itself
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember[];
  }
  // If response is already the array
  return response as FamilyMember[];
}

/**
 * Get a specific family member by ID
 */
export async function getFamilyMember(id: string): Promise<FamilyMember> {
  const response = await apiClient.get(`/api/family-members/${id}`);
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Create a new family member
 */
export async function createFamilyMember(data: CreateFamilyMemberRequest): Promise<FamilyMember> {
  const response = await apiClient.post('/api/family-members', data);
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Update a family member
 */
export async function updateFamilyMember(id: string, data: UpdateFamilyMemberRequest): Promise<FamilyMember> {
  const response = await apiClient.put(`/api/family-members/${id}`, data);
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(id: string): Promise<void> {
  await apiClient.delete(`/api/family-members/${id}`);
}

/**
 * Switch to a different family member profile
 */
export async function switchProfile(id: string): Promise<FamilyMember> {
  const response = await apiClient.post(`/api/family-members/${id}/switch`, {});
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Grant parent consent for a minor (14-17)
 */
export async function grantConsent(id: string, consentData?: ConsentData): Promise<FamilyMember> {
  const response = await apiClient.post(`/api/family-members/${id}/consent/grant`, consentData || {});
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Revoke parent consent
 */
export async function revokeConsent(id: string, reason?: string): Promise<FamilyMember> {
  const response = await apiClient.post(`/api/family-members/${id}/consent/revoke`, { reason });
  // Backend returns { success: true, data: member }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Check if consent renewal is needed
 */
export async function checkConsentRenewal(id: string): Promise<{ needsRenewal: boolean; lastCheck?: string }> {
  const response = await apiClient.get(`/api/family-members/${id}/consent/check`);
  // Backend returns { success: true, data: { needsRenewal, lastCheck } }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as { needsRenewal: boolean; lastCheck?: string };
  }
  return response as { needsRenewal: boolean; lastCheck?: string };
}

/**
 * Update birth date for a family member
 * Used when birth_date is NULL and age verification is needed
 * Recalculates COPPA access fields based on calculated age
 * Can also update currentCenter and profileImageUrl
 */
export async function updateBirthDate(
  id: string, 
  birthDate: string,
  additionalData?: { currentCenter?: string; profileImageUrl?: string }
): Promise<FamilyMember> {
  const response = await apiClient.post(`/api/family-members/${id}/birth-date`, { 
    birthDate,
    ...additionalData
  });
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as FamilyMember;
  }
  return response as FamilyMember;
}

/**
 * Get access logs for all family members
 */
export async function getAccessLogs(limit: number = 50): Promise<AccessLog[]> {
  const response = await apiClient.get(`/api/family-members/logs/access?limit=${limit}`);
  // Backend returns { success: true, data: logs }
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as AccessLog[];
  }
  return response as AccessLog[];
}
