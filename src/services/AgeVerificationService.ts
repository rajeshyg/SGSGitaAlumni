// ============================================================================
// AGE VERIFICATION SERVICE IMPLEMENTATION
// ============================================================================
// Service for COPPA-compliant age verification and parent consent management

import {
  AgeVerificationResult,
  AgeVerificationServiceInterface,
  AgeVerificationError,
  ParentConsentRecord,
  UserRegistrationData
} from '../types/invitation';
import { apiClient } from '../lib/api';

export class AgeVerificationService implements AgeVerificationServiceInterface {
  private readonly MINIMUM_AGE = 14; // Business requirement: 14+ only
  private readonly PARENT_CONSENT_AGE = 18; // Require parent consent under 18
  private readonly CONSENT_VALIDITY_DAYS = 365; // Annual renewal

  // ============================================================================
  // CORE AGE VERIFICATION METHODS
  // ============================================================================

  async verifyAge(birthDate: Date): Promise<AgeVerificationResult> {
    try {
      // Validate birth date
      if (!this.isValidBirthDate(birthDate)) {
        return {
          isValid: false,
          age: 0,
          requiresParentConsent: false,
          isMinorWithoutConsent: false,
          errors: ['Invalid birth date provided']
        };
      }

      // Calculate age
      const age = this.calculateAge(birthDate);

      // Check minimum age requirement
      if (age < this.MINIMUM_AGE) {
        return {
          isValid: false,
          age,
          requiresParentConsent: false,
          isMinorWithoutConsent: true,
          errors: [`Users must be at least ${this.MINIMUM_AGE} years old`]
        };
      }

      // Check if parent consent is required
      const requiresParentConsent = this.requiresParentConsent(age);

      return {
        isValid: true,
        age,
        requiresParentConsent,
        isMinorWithoutConsent: false,
        errors: []
      };

    } catch (error) {
      return {
        isValid: false,
        age: 0,
        requiresParentConsent: false,
        isMinorWithoutConsent: false,
        errors: ['Age verification failed']
      };
    }
  }

  requiresParentConsent(age: number): boolean {
    return age < this.PARENT_CONSENT_AGE;
  }

  async collectParentConsent(
    parentEmail: string, 
    childData: UserRegistrationData
  ): Promise<ParentConsentRecord> {
    try {
      // Validate inputs
      this.validateParentConsentRequest(parentEmail, childData);

      // Verify child's age requires consent
      const ageVerification = await this.verifyAge(childData.birthDate);
      if (!ageVerification.requiresParentConsent) {
        throw new AgeVerificationError(
          'Parent consent not required for this age',
          'CONSENT_NOT_REQUIRED',
          400
        );
      }

      // Generate secure consent token
      const consentToken = this.generateSecureToken();

      // Calculate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CONSENT_VALIDITY_DAYS);

      // Create consent record
      const consentData = {
        parentEmail,
        childData: {
          firstName: childData.firstName,
          lastName: childData.lastName,
          birthDate: childData.birthDate.toISOString(),
          graduationYear: childData.graduationYear
        },
        consentToken,
        expiresAt: expiresAt.toISOString()
      };

      const response = await apiClient.post('/api/age-verification/parent-consent', consentData);
      const consentRecord: ParentConsentRecord = response.data;

      // Send consent email to parent
      await this.sendParentConsentEmail(parentEmail, consentToken, childData);

      return consentRecord;

    } catch (error) {
      if (error instanceof AgeVerificationError) {
        throw error;
      }
      throw new AgeVerificationError(
        'Failed to collect parent consent',
        'CONSENT_COLLECTION_FAILED',
        500
      );
    }
  }

  async validateParentConsent(consentToken: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/age-verification/validate-consent/${consentToken}`);
      const consentRecord: ParentConsentRecord = response.data;

      if (!consentRecord) {
        return false;
      }

      // Check if consent is given
      if (!consentRecord.consentGiven) {
        return false;
      }

      // Check if consent is still valid (not expired)
      if (new Date() > new Date(consentRecord.expiresAt)) {
        return false;
      }

      // Check if consent is still active
      if (!consentRecord.isActive) {
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  async renewParentConsent(consentId: string): Promise<ParentConsentRecord> {
    try {
      // Get existing consent record
      const existingConsent = await this.getConsentRecord(consentId);
      
      if (!existingConsent) {
        throw new AgeVerificationError(
          'Consent record not found',
          'CONSENT_NOT_FOUND',
          404
        );
      }

      // Generate new consent token
      const newConsentToken = this.generateSecureToken();

      // Calculate new expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CONSENT_VALIDITY_DAYS);

      // Update consent record
      const updateData = {
        consentToken: newConsentToken,
        expiresAt: expiresAt.toISOString(),
        consentGiven: false, // Reset consent - parent must give consent again
        isActive: true
      };

      const response = await apiClient.patch(`/api/age-verification/parent-consent/${consentId}`, updateData);
      const renewedConsent: ParentConsentRecord = response.data;

      // Send renewal email to parent
      await this.sendConsentRenewalEmail(existingConsent.parentEmail, newConsentToken);

      return renewedConsent;

    } catch (error) {
      if (error instanceof AgeVerificationError) {
        throw error;
      }
      throw new AgeVerificationError(
        'Failed to renew parent consent',
        'CONSENT_RENEWAL_FAILED',
        500
      );
    }
  }

  // ============================================================================
  // CONSENT MANAGEMENT METHODS
  // ============================================================================

  async confirmParentConsent(
    consentToken: string, 
    parentSignature: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ParentConsentRecord> {
    try {
      // Validate consent token
      const isValid = await this.validateConsentToken(consentToken);
      if (!isValid) {
        throw new AgeVerificationError(
          'Invalid or expired consent token',
          'INVALID_CONSENT_TOKEN',
          400
        );
      }

      // Update consent record with confirmation
      const confirmationData = {
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        digitalSignature: parentSignature,
        consentIpAddress: ipAddress,
        consentUserAgent: userAgent
      };

      const response = await apiClient.patch(`/api/age-verification/confirm-consent/${consentToken}`, confirmationData);
      const confirmedConsent: ParentConsentRecord = response.data;

      return confirmedConsent;

    } catch (error) {
      if (error instanceof AgeVerificationError) {
        throw error;
      }
      throw new AgeVerificationError(
        'Failed to confirm parent consent',
        'CONSENT_CONFIRMATION_FAILED',
        500
      );
    }
  }

  async revokeParentConsent(consentId: string, reason?: string): Promise<void> {
    try {
      const revokeData = {
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokeReason: reason
      };

      await apiClient.patch(`/api/age-verification/parent-consent/${consentId}/revoke`, revokeData);

    } catch (error) {
      throw new AgeVerificationError(
        'Failed to revoke parent consent',
        'CONSENT_REVOKE_FAILED',
        500
      );
    }
  }

  async getConsentStatus(childUserId: string): Promise<{
    hasConsent: boolean;
    consentRecord?: ParentConsentRecord;
    isExpired: boolean;
    daysUntilExpiry?: number;
  }> {
    try {
      const response = await apiClient.get(`/api/age-verification/consent-status/${childUserId}`);
      return response.data;
    } catch (error) {
      return {
        hasConsent: false,
        isExpired: true
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isValidBirthDate(birthDate: Date): boolean {
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
    const maxDate = new Date(now.getFullYear() - this.MINIMUM_AGE, now.getMonth(), now.getDate());

    return birthDate >= minDate && birthDate <= maxDate;
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private validateParentConsentRequest(parentEmail: string, childData: UserRegistrationData): void {
    if (!parentEmail || !this.isValidEmail(parentEmail)) {
      throw new AgeVerificationError(
        'Valid parent email is required',
        'INVALID_PARENT_EMAIL',
        400
      );
    }

    if (!childData.firstName || !childData.lastName) {
      throw new AgeVerificationError(
        'Child name is required',
        'CHILD_NAME_REQUIRED',
        400
      );
    }

    if (!childData.birthDate) {
      throw new AgeVerificationError(
        'Child birth date is required',
        'CHILD_BIRTHDATE_REQUIRED',
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

  private async validateConsentToken(consentToken: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/age-verification/validate-token/${consentToken}`);
      return response.data.isValid;
    } catch (error) {
      return false;
    }
  }

  private async getConsentRecord(consentId: string): Promise<ParentConsentRecord | null> {
    try {
      const response = await apiClient.get(`/api/age-verification/parent-consent/${consentId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async sendParentConsentEmail(
    parentEmail: string, 
    consentToken: string, 
    childData: UserRegistrationData
  ): Promise<void> {
    try {
      await apiClient.post('/api/email/parent-consent', {
        parentEmail,
        consentToken,
        childName: `${childData.firstName} ${childData.lastName}`,
        graduationYear: childData.graduationYear
      });
    } catch (error) {
      // Log error but don't throw - email failures shouldn't break consent collection
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to send parent consent email:', error);
      }
    }
  }

  private async sendConsentRenewalEmail(parentEmail: string, consentToken: string): Promise<void> {
    try {
      await apiClient.post('/api/email/consent-renewal', {
        parentEmail,
        consentToken
      });
    } catch (error) {
      // Log error but don't throw - email failures shouldn't break renewal
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to send consent renewal email:', error);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get age verification statistics for monitoring
   */
  async getAgeVerificationStatistics(): Promise<{
    totalVerifications: number;
    minorRegistrations: number;
    parentConsentRate: number;
    averageAge: number;
  }> {
    try {
      const response = await apiClient.get('/api/age-verification/statistics');
      return response.data;
    } catch (error) {
      return {
        totalVerifications: 0,
        minorRegistrations: 0,
        parentConsentRate: 0,
        averageAge: 0
      };
    }
  }

  /**
   * Check if user needs consent renewal
   */
  async needsConsentRenewal(childUserId: string): Promise<boolean> {
    try {
      const status = await this.getConsentStatus(childUserId);
      
      if (!status.hasConsent) {
        return false;
      }

      // Check if consent expires within 30 days
      return status.daysUntilExpiry !== undefined && status.daysUntilExpiry <= 30;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get minimum age requirement
   */
  getMinimumAge(): number {
    return this.MINIMUM_AGE;
  }

  /**
   * Get parent consent age threshold
   */
  getParentConsentAge(): number {
    return this.PARENT_CONSENT_AGE;
  }
}
