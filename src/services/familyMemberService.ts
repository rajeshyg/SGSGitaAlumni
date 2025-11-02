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
}

export interface UpdateFamilyMemberRequest extends Record<string, unknown> {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
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
  const response = await apiClient.get('/family-members');
  return response.data;
}

/**
 * Get a specific family member by ID
 */
export async function getFamilyMember(id: string): Promise<FamilyMember> {
  const response = await apiClient.get(`/family-members/${id}`);
  return response.data;
}

/**
 * Create a new family member
 */
export async function createFamilyMember(data: CreateFamilyMemberRequest): Promise<FamilyMember> {
  const response = await apiClient.post('/family-members', data);
  return response.data;
}

/**
 * Update a family member
 */
export async function updateFamilyMember(id: string, data: UpdateFamilyMemberRequest): Promise<FamilyMember> {
  const response = await apiClient.put(`/family-members/${id}`, data);
  return response.data;
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(id: string): Promise<void> {
  await apiClient.delete(`/family-members/${id}`);
}

/**
 * Switch to a different family member profile
 */
export async function switchProfile(id: string): Promise<FamilyMember> {
  const response = await apiClient.post(`/family-members/${id}/switch`, {});
  return response.data;
}

/**
 * Grant parent consent for a minor (14-17)
 */
export async function grantConsent(id: string): Promise<FamilyMember> {
  const response = await apiClient.post(`/family-members/${id}/consent/grant`, {});
  return response.data;
}

/**
 * Revoke parent consent
 */
export async function revokeConsent(id: string, reason?: string): Promise<FamilyMember> {
  const response = await apiClient.post(`/family-members/${id}/consent/revoke`, { reason });
  return response.data;
}

/**
 * Check if consent renewal is needed
 */
export async function checkConsentRenewal(id: string): Promise<{ needsRenewal: boolean; lastCheck?: string }> {
  const response = await apiClient.get(`/family-members/${id}/consent/check`);
  return response.data;
}

/**
 * Get access logs for all family members
 */
export async function getAccessLogs(limit: number = 50): Promise<AccessLog[]> {
  const response = await apiClient.get(`/family-members/logs/access?limit=${limit}`);
  return response.data;
}
