// ============================================================================
// EMAIL SERVICE (JavaScript stub)
// ============================================================================
// Basic email service stub for server-side compatibility

export class EmailService {
  constructor() {
    // Stub implementation - no actual email sending on server
  }

  async sendInvitationEmail(invitation) {
    // Stub - no email sending on server
    console.log('EmailService: Would send invitation email to', invitation.email);
  }

  async sendOTPEmail(email, otpCode, type) {
    // Stub - no email sending on server
    console.log('EmailService: Would send OTP email to', email);
  }

  async sendFamilyInvitationEmail(familyInvitation) {
    // Stub - no email sending on server
    console.log('EmailService: Would send family invitation email to', familyInvitation.parentEmail);
  }

  async sendWelcomeEmail(user) {
    // Stub - no email sending on server
    console.log('EmailService: Would send welcome email to', user.email);
  }

  async sendParentConsentEmail(parentEmail, consentToken, childName) {
    // Stub - no email sending on server
    console.log('EmailService: Would send parent consent email to', parentEmail);
  }

  async trackEmailDelivery(emailId) {
    // Stub
    return { status: 'unknown' };
  }

  async getEmailTemplate(templateId) {
    // Return a basic template
    return {
      id: templateId,
      name: 'Default Template',
      subject: 'Default Subject',
      htmlContent: '<p>Default content</p>',
      textContent: 'Default content',
      variables: []
    };
  }
}

export default EmailService;