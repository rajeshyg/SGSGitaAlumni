// ============================================================================
// EMAIL SERVICE IMPLEMENTATION
// ============================================================================
// Centralized email service for invitations, OTP, and notifications

import { apiClient } from '../lib/api';
import { 
  EmailTemplate, 
  EmailDeliveryLog, 
  EmailType, 
  EmailDeliveryStatus,
  Invitation,
  FamilyInvitation,
  OTPType 
} from '../types/invitation';
import { User } from './APIService';

export class EmailError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

export interface EmailServiceInterface {
  sendInvitationEmail(invitation: Invitation): Promise<void>;
  sendOTPEmail(email: string, otpCode: string, type: OTPType): Promise<void>;
  sendFamilyInvitationEmail(familyInvitation: FamilyInvitation): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
  sendParentConsentEmail(parentEmail: string, consentToken: string, childName: string): Promise<void>;
  trackEmailDelivery(emailId: string): Promise<EmailDeliveryLog>;
  getEmailTemplate(templateId: string): Promise<EmailTemplate>;
}

export class EmailService implements EmailServiceInterface {
  private readonly EMAIL_PROVIDER = import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid';
  private readonly FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'noreply@sgs-gita-alumni.com';
  private readonly FROM_NAME = import.meta.env.VITE_FROM_NAME || 'SGS Gita Alumni Network';

  // ============================================================================
  // INVITATION EMAILS
  // ============================================================================

  async sendInvitationEmail(invitation: Invitation): Promise<void> {
    try {
      const template = await this.getEmailTemplate('alumni-invitation');
      
      const emailData = {
        to: invitation.email,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: 'Welcome to SGS Gita Alumni Network',
        templateId: template.id,
        templateData: {
          invitationToken: invitation.invitationToken,
          inviterName: invitation.invitedBy, // TODO: Get actual inviter name
          expirationDate: invitation.expiresAt.toLocaleDateString(),
          invitationLink: `${window.location.origin}/invitation/${invitation.invitationToken}`,
          platformName: 'SGS Gita Alumni Network'
        }
      };

      await this.sendEmail(emailData);
      
      // Log email delivery
      await this.logEmailDelivery({
        emailType: 'invitation',
        recipientEmail: invitation.email,
        templateId: template.id,
        subject: emailData.subject
      });

    } catch (error) {
      throw new EmailError(
        'Failed to send invitation email',
        'INVITATION_EMAIL_FAILED',
        500
      );
    }
  }

  async sendFamilyInvitationEmail(familyInvitation: FamilyInvitation): Promise<void> {
    try {
      const template = await this.getEmailTemplate('family-invitation');
      
      const childrenNames = familyInvitation.childrenProfiles
        .map(child => `${child.firstName} ${child.lastName}`)
        .join(', ');

      const emailData = {
        to: familyInvitation.parentEmail,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: 'Family Invitation to SGS Gita Alumni Network',
        templateId: template.id,
        templateData: {
          invitationToken: familyInvitation.invitationToken,
          childrenNames,
          childrenCount: familyInvitation.childrenProfiles.length,
          expirationDate: familyInvitation.expiresAt.toLocaleDateString(),
          invitationLink: `${window.location.origin}/family-invitation/${familyInvitation.invitationToken}`,
          platformName: 'SGS Gita Alumni Network'
        }
      };

      await this.sendEmail(emailData);
      
      await this.logEmailDelivery({
        emailType: 'family_invitation',
        recipientEmail: familyInvitation.parentEmail,
        templateId: template.id,
        subject: emailData.subject
      });

    } catch (error) {
      throw new EmailError(
        'Failed to send family invitation email',
        'FAMILY_INVITATION_EMAIL_FAILED',
        500
      );
    }
  }

  // ============================================================================
  // OTP EMAILS
  // ============================================================================

  async sendOTPEmail(email: string, otpCode: string, type: OTPType): Promise<void> {
    try {
      const template = await this.getEmailTemplate('otp-verification');
      
      const subjectMap = {
        login: 'Your Login Verification Code',
        registration: 'Complete Your Registration',
        password_reset: 'Password Reset Verification'
      };

      const emailData = {
        to: email,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: subjectMap[type],
        templateId: template.id,
        templateData: {
          otpCode,
          otpType: type,
          expirationMinutes: 5,
          platformName: 'SGS Gita Alumni Network',
          supportEmail: 'support@sgs-gita-alumni.com'
        }
      };

      await this.sendEmail(emailData);
      
      await this.logEmailDelivery({
        emailType: 'otp',
        recipientEmail: email,
        templateId: template.id,
        subject: emailData.subject
      });

    } catch (error) {
      throw new EmailError(
        'Failed to send OTP email',
        'OTP_EMAIL_FAILED',
        500
      );
    }
  }

  // ============================================================================
  // WELCOME & CONSENT EMAILS
  // ============================================================================

  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      const template = await this.getEmailTemplate('welcome');
      
      const emailData = {
        to: user.email,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: 'Welcome to SGS Gita Alumni Network!',
        templateId: template.id,
        templateData: {
          firstName: user.firstName,
          lastName: user.lastName,
          loginLink: `${window.location.origin}/login`,
          platformName: 'SGS Gita Alumni Network',
          supportEmail: 'support@sgs-gita-alumni.com'
        }
      };

      await this.sendEmail(emailData);
      
      await this.logEmailDelivery({
        emailType: 'welcome',
        recipientEmail: user.email,
        templateId: template.id,
        subject: emailData.subject
      });

    } catch (error) {
      throw new EmailError(
        'Failed to send welcome email',
        'WELCOME_EMAIL_FAILED',
        500
      );
    }
  }

  async sendParentConsentEmail(parentEmail: string, consentToken: string, childName: string): Promise<void> {
    try {
      const template = await this.getEmailTemplate('parent-consent');
      
      const emailData = {
        to: parentEmail,
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        subject: 'Parent Consent Required - SGS Gita Alumni Network',
        templateId: template.id,
        templateData: {
          childName,
          consentToken,
          consentLink: `${window.location.origin}/parent-consent/${consentToken}`,
          platformName: 'SGS Gita Alumni Network',
          privacyPolicyLink: `${window.location.origin}/privacy-policy`,
          supportEmail: 'support@sgs-gita-alumni.com'
        }
      };

      await this.sendEmail(emailData);
      
      await this.logEmailDelivery({
        emailType: 'parent_consent',
        recipientEmail: parentEmail,
        templateId: template.id,
        subject: emailData.subject
      });

    } catch (error) {
      throw new EmailError(
        'Failed to send parent consent email',
        'PARENT_CONSENT_EMAIL_FAILED',
        500
      );
    }
  }

  // ============================================================================
  // CORE EMAIL METHODS
  // ============================================================================

  private async sendEmail(emailData: any): Promise<void> {
    try {
      await apiClient.post('/api/email/send', emailData);
    } catch (error) {
      throw new EmailError(
        'Email delivery failed',
        'EMAIL_DELIVERY_FAILED',
        500
      );
    }
  }

  async trackEmailDelivery(emailId: string): Promise<EmailDeliveryLog> {
    try {
      const response = await apiClient.get(`/api/email/delivery/${emailId}`);
      return response.data;
    } catch (error) {
      throw new EmailError(
        'Failed to track email delivery',
        'EMAIL_TRACKING_FAILED',
        500
      );
    }
  }

  async getEmailTemplate(templateId: string): Promise<EmailTemplate> {
    try {
      const response = await apiClient.get(`/api/email/templates/${templateId}`);
      return response.data;
    } catch (error) {
      // Return default template if not found
      return this.getDefaultTemplate(templateId);
    }
  }

  private async logEmailDelivery(logData: {
    emailType: EmailType;
    recipientEmail: string;
    templateId?: string;
    subject?: string;
  }): Promise<void> {
    try {
      await apiClient.post('/api/email/delivery-log', {
        ...logData,
        deliveryStatus: 'sent' as EmailDeliveryStatus,
        sentAt: new Date().toISOString()
      });
    } catch (error) {
      // Log error but don't throw - email logging failures shouldn't break email sending
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to log email delivery:', error);
      }
    }
  }

  // ============================================================================
  // DEFAULT TEMPLATES
  // ============================================================================

  private getDefaultTemplate(templateId: string): EmailTemplate {
    const defaultTemplates: Record<string, EmailTemplate> = {
      'alumni-invitation': {
        id: 'alumni-invitation',
        name: 'Alumni Invitation',
        subject: 'Welcome to SGS Gita Alumni Network',
        htmlContent: `
          <h1>Welcome to SGS Gita Alumni Network</h1>
          <p>You've been invited to join our global alumni community.</p>
          <p><a href="{{invitationLink}}">Accept Invitation</a></p>
          <p>This invitation expires on {{expirationDate}}.</p>
        `,
        textContent: `
          Welcome to SGS Gita Alumni Network
          You've been invited to join our global alumni community.
          Accept your invitation: {{invitationLink}}
          This invitation expires on {{expirationDate}}.
        `,
        variables: ['invitationLink', 'expirationDate', 'inviterName']
      },
      'otp-verification': {
        id: 'otp-verification',
        name: 'OTP Verification',
        subject: 'Your Verification Code',
        htmlContent: `
          <h1>Your Verification Code</h1>
          <p>Your verification code is: <strong>{{otpCode}}</strong></p>
          <p>This code expires in {{expirationMinutes}} minutes.</p>
        `,
        textContent: `
          Your verification code is: {{otpCode}}
          This code expires in {{expirationMinutes}} minutes.
        `,
        variables: ['otpCode', 'expirationMinutes']
      },
      'welcome': {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to SGS Gita Alumni Network!',
        htmlContent: `
          <h1>Welcome {{firstName}}!</h1>
          <p>Your account has been created successfully.</p>
          <p><a href="{{loginLink}}">Login to your account</a></p>
        `,
        textContent: `
          Welcome {{firstName}}!
          Your account has been created successfully.
          Login: {{loginLink}}
        `,
        variables: ['firstName', 'loginLink']
      }
    };

    return defaultTemplates[templateId] || defaultTemplates['welcome'];
  }
}
