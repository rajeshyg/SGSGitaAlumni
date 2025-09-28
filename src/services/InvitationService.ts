// ============================================================================
// INVITATION SERVICE IMPLEMENTATION
// ============================================================================
// Core service for managing invitation-based user registration

import {
  Invitation,
  InvitationRequest,
  InvitationValidation,
  InvitationServiceInterface,
  InvitationError,
  UserRegistrationData,
  InvitationFilters,
  PaginatedResponse
} from '../types/invitation';
import { User } from './APIService';
import { apiClient } from '../lib/api';
import { AgeVerificationService } from './AgeVerificationService';
import { OTPService } from './OTPService';
import { EmailService } from './EmailService';

export class InvitationService implements InvitationServiceInterface {
  private ageVerificationService: AgeVerificationService;
  private otpService: OTPService;
  private emailService: EmailService;

  constructor() {
    this.ageVerificationService = new AgeVerificationService();
    this.otpService = new OTPService();
    this.emailService = new EmailService();
  }

  // ============================================================================
  // CORE INVITATION METHODS
  // ============================================================================

  async createInvitation(request: InvitationRequest): Promise<Invitation> {
    try {
      // Validate request
      this.validateInvitationRequest(request);

      // Check if email already has pending invitation
      const existingInvitation = await this.findPendingInvitation(request.email);
      if (existingInvitation) {
        throw new InvitationError(
          'User already has a pending invitation',
          'INVITATION_ALREADY_EXISTS',
          409
        );
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(request.email);
      if (existingUser) {
        throw new InvitationError(
          'User with this email already exists',
          'USER_ALREADY_EXISTS',
          409
        );
      }

      // Generate secure invitation token
      const invitationToken = this.generateSecureToken();
      
      // Calculate expiration date
      const expiresInDays = request.expiresInDays || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create invitation in database
      const invitationData = {
        email: request.email,
        invitationToken,
        invitedBy: request.invitedBy,
        invitationType: request.type,
        invitationData: request.data,
        expiresAt: expiresAt.toISOString(),
        status: 'pending'
      };

      const response = await apiClient.post('/api/invitations', invitationData);
      const invitation: Invitation = response.data;

      // Log invitation creation
      await this.logInvitationAction(invitation.id, 'created', request.invitedBy);

      return invitation;
    } catch (error) {
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError(
        'Failed to create invitation',
        'INVITATION_CREATION_FAILED',
        500
      );
    }
  }

  async sendInvitation(invitationId: string): Promise<void> {
    try {
      // Get invitation details
      const invitation = await this.getInvitationById(invitationId);
      
      if (!invitation) {
        throw new InvitationError(
          'Invitation not found',
          'INVITATION_NOT_FOUND',
          404
        );
      }

      if (invitation.status !== 'pending') {
        throw new InvitationError(
          'Invitation is not in pending status',
          'INVITATION_NOT_PENDING',
          400
        );
      }

      // Send invitation email
      await this.emailService.sendInvitationEmail(invitation);

      // Update invitation sent timestamp
      await apiClient.request(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sentAt: new Date().toISOString(),
          resendCount: invitation.resendCount + 1,
          lastResentAt: new Date().toISOString()
        })
      });

      // Log invitation sent
      await this.logInvitationAction(invitationId, 'sent', invitation.invitedBy);

    } catch (error) {
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError(
        'Failed to send invitation',
        'INVITATION_SEND_FAILED',
        500
      );
    }
  }

  async validateInvitation(token: string): Promise<InvitationValidation> {
    try {
      const response = await apiClient.get(`/api/invitations/validate/${token}`);
      const invitation: Invitation | null = response.data.invitation;

      if (!invitation) {
        return {
          isValid: false,
          invitation: null,
          errors: ['Invalid invitation token'],
          requiresParentConsent: false,
          isExpired: false,
          isAlreadyUsed: false
        };
      }

      const errors: string[] = [];
      let isValid = true;
      let requiresParentConsent = false;

      // Check if invitation is expired
      const isExpired = new Date() > new Date(invitation.expiresAt);
      if (isExpired) {
        errors.push('Invitation has expired');
        isValid = false;
      }

      // Check if invitation is already used
      const isAlreadyUsed = invitation.isUsed;
      if (isAlreadyUsed) {
        errors.push('Invitation has already been used');
        isValid = false;
      }

      // Check invitation status
      if (invitation.status !== 'pending') {
        errors.push(`Invitation status is ${invitation.status}`);
        isValid = false;
      }

      // For alumni invitations, check if age verification might be needed
      if (invitation.invitationType === 'alumni' && invitation.invitationData?.graduationYear) {
        const estimatedAge = new Date().getFullYear() - invitation.invitationData.graduationYear + 18;
        requiresParentConsent = this.ageVerificationService.requiresParentConsent(estimatedAge);
      }

      return {
        isValid,
        invitation,
        errors,
        requiresParentConsent,
        isExpired,
        isAlreadyUsed
      };

    } catch (error) {
      return {
        isValid: false,
        invitation: null,
        errors: ['Failed to validate invitation'],
        requiresParentConsent: false,
        isExpired: false,
        isAlreadyUsed: false
      };
    }
  }

  async acceptInvitation(token: string, userData: UserRegistrationData): Promise<User> {
    try {
      // Validate invitation first
      const validation = await this.validateInvitation(token);
      
      if (!validation.isValid || !validation.invitation) {
        throw new InvitationError(
          validation.errors.join(', '),
          'INVALID_INVITATION',
          400
        );
      }

      // Perform age verification
      const ageVerification = await this.ageVerificationService.verifyAge(userData.birthDate);
      
      if (!ageVerification.isValid) {
        throw new InvitationError(
          ageVerification.errors.join(', '),
          'AGE_VERIFICATION_FAILED',
          400
        );
      }

      // Handle parent consent if required
      if (ageVerification.requiresParentConsent) {
        if (!userData.parentEmail || !userData.parentConsentToken) {
          throw new InvitationError(
            'Parent consent is required for users under 18',
            'PARENT_CONSENT_REQUIRED',
            400
          );
        }

        const consentValid = await this.ageVerificationService.validateParentConsent(
          userData.parentConsentToken
        );
        
        if (!consentValid) {
          throw new InvitationError(
            'Invalid or expired parent consent',
            'INVALID_PARENT_CONSENT',
            400
          );
        }
      }

      // Create user account
      const userCreationData = {
        ...userData,
        email: validation.invitation.email,
        invitationId: validation.invitation.id,
        requiresOtp: true,
        ageVerified: true,
        parentConsentRequired: ageVerification.requiresParentConsent,
        parentConsentGiven: ageVerification.requiresParentConsent
      };

      const userResponse = await apiClient.post('/api/auth/register-from-invitation', userCreationData);
      const user: User = userResponse.data.user;

      // Mark invitation as used
      await apiClient.request(`/api/invitations/${validation.invitation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'accepted',
          isUsed: true,
          usedAt: new Date().toISOString(),
          acceptedBy: user.id
        })
      });

      // Log invitation acceptance
      await this.logInvitationAction(validation.invitation.id, 'accepted', user.id);

      return user;

    } catch (error) {
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError(
        'Failed to accept invitation',
        'INVITATION_ACCEPTANCE_FAILED',
        500
      );
    }
  }

  async resendInvitation(invitationId: string): Promise<void> {
    try {
      const invitation = await this.getInvitationById(invitationId);
      
      if (!invitation) {
        throw new InvitationError(
          'Invitation not found',
          'INVITATION_NOT_FOUND',
          404
        );
      }

      if (invitation.status !== 'pending') {
        throw new InvitationError(
          'Can only resend pending invitations',
          'INVITATION_NOT_PENDING',
          400
        );
      }

      // Check resend limits
      if (invitation.resendCount >= 3) {
        throw new InvitationError(
          'Maximum resend limit reached',
          'RESEND_LIMIT_EXCEEDED',
          429
        );
      }

      // Resend invitation email
      await this.emailService.sendInvitationEmail(invitation);

      // Update resend count
      await apiClient.request(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resendCount: invitation.resendCount + 1,
          lastResentAt: new Date().toISOString()
        })
      });

      // Log resend action
      await this.logInvitationAction(invitationId, 'resent', invitation.invitedBy);

    } catch (error) {
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError(
        'Failed to resend invitation',
        'INVITATION_RESEND_FAILED',
        500
      );
    }
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    try {
      const invitation = await this.getInvitationById(invitationId);
      
      if (!invitation) {
        throw new InvitationError(
          'Invitation not found',
          'INVITATION_NOT_FOUND',
          404
        );
      }

      if (invitation.status !== 'pending') {
        throw new InvitationError(
          'Can only revoke pending invitations',
          'INVITATION_NOT_PENDING',
          400
        );
      }

      // Update invitation status
      await apiClient.request(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'revoked'
        })
      });

      // Log revocation
      await this.logInvitationAction(invitationId, 'revoked', invitation.invitedBy);

    } catch (error) {
      if (error instanceof InvitationError) {
        throw error;
      }
      throw new InvitationError(
        'Failed to revoke invitation',
        'INVITATION_REVOKE_FAILED',
        500
      );
    }
  }

  async getInvitationStatus(token: string): Promise<Invitation> {
    try {
      const response = await apiClient.get(`/api/invitations/status/${token}`);
      return response.data;
    } catch (error) {
      throw new InvitationError(
        'Failed to get invitation status',
        'INVITATION_STATUS_FAILED',
        500
      );
    }
  }

  async listInvitations(filters?: InvitationFilters): Promise<Invitation[]> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }

      const response = await apiClient.get(`/api/invitations?${params.toString()}`);
      // Return just the data array to match the interface
      return response.data.data || response.data;
    } catch (error) {
      throw new InvitationError(
        'Failed to list invitations',
        'INVITATION_LIST_FAILED',
        500
      );
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateInvitationRequest(request: InvitationRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new InvitationError(
        'Valid email address is required',
        'INVALID_EMAIL',
        400
      );
    }

    if (!request.type || !['alumni', 'family_member', 'admin'].includes(request.type)) {
      throw new InvitationError(
        'Valid invitation type is required',
        'INVALID_TYPE',
        400
      );
    }

    if (!request.invitedBy) {
      throw new InvitationError(
        'Invited by user ID is required',
        'INVITED_BY_REQUIRED',
        400
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateSecureToken(): string {
    // Generate cryptographically secure token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async findPendingInvitation(email: string): Promise<Invitation | null> {
    try {
      const response = await apiClient.get(`/api/invitations/pending/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await apiClient.get(`/api/users/by-email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async getInvitationById(id: string): Promise<Invitation | null> {
    try {
      const response = await apiClient.get(`/api/invitations/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async logInvitationAction(
    invitationId: string, 
    action: string, 
    performedBy?: string
  ): Promise<void> {
    try {
      await apiClient.post('/api/invitations/audit-log', {
        invitationId,
        action,
        performedBy,
        timestamp: new Date().toISOString()
      });
    } catch (auditError) {
      // Log audit failures but don't throw - audit logging shouldn't break main flow
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to log invitation action:', auditError);
      }
    }
  }
}
