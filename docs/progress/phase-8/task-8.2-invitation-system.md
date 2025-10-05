# Task 8.2: Invitation System Security Enhancement

**Status:** 🔄 In Progress (Security Phase)
**Priority:** High
**Duration:** Extended to 3 weeks
**Dependencies:** Task 8.1 (Age Verification)
**New Focus:** Passwordless authentication with enhanced security measures

## Overview
Implement comprehensive invitation-based registration system with enhanced security measures, passwordless authentication, email verification, OTP authentication, and family member invitation management. This security enhancement focuses on passwordless authentication model with HMAC-signed tokens, server-side rate limiting, and database encryption for sensitive data, following industry best practices and compliance requirements.

## Requirements Analysis

### Business Requirements from Meeting
- **Invitation-Based Registration:** All users join via invitation link
- **Email Confirmation:** Users navigate via invitation link and accept terms
- **OTP System:** Email-based OTP for secure access without daily login
- **Parent Email Invitations:** For families with multiple children
- **Profile Selection:** Parents can choose profile when multiple children graduated

#### Passwordless Authentication Flow
- **Step 1:** Invitation links (HMAC-signed for security)
- **Step 2:** Terms acceptance and age verification
- **Step 3:** OTP verification (email-based, with TOTP authenticator support)
- **Step 4:** Secure access without password requirements

### Technical Requirements
- **Token-Based Security:** Secure invitation tokens with expiration
- **Email Integration:** Reliable email delivery system
- **OTP Management:** Secure one-time password generation and validation
- **Family Linking:** Support for multiple children under one parent email

#### Passwordless Security Model
- **HMAC-SHA256 Tokens:** Cryptographically signed invitation tokens
- **Server-Side Rate Limiting:** Redis-based protection against abuse
- **Database Encryption:** AES-256-GCM for sensitive data fields
- **Multi-Factor OTP:** TOTP authenticator and SMS OTP support

## Database Schema Implementation

### New USER_INVITATIONS Table
```sql
CREATE TABLE USER_INVITATIONS (
    uuid id PK,
    string email NOT NULL,
    string invitation_token UK NOT NULL,
    uuid invited_by FK, -- Admin/moderator who sent invitation
    enum invitation_type "alumni,family_member,admin",
    json invitation_data, -- Graduation info, relationship, etc.
    enum status "pending,accepted,expired,revoked",
    timestamp sent_at,
    timestamp expires_at,
    boolean is_used DEFAULT FALSE,
    timestamp used_at,
    uuid accepted_by FK, -- User who accepted invitation
    string ip_address, -- IP where invitation was accepted
    integer resend_count DEFAULT 0,
    timestamp last_resent_at
);
```

### New OTP_TOKENS Table
```sql
CREATE TABLE OTP_TOKENS (
    uuid id PK,
    string email NOT NULL,
    string otp_code NOT NULL,
    enum token_type "login,registration,password_reset",
    uuid user_id FK, -- Null for registration OTPs
    timestamp generated_at,
    timestamp expires_at,
    boolean is_used DEFAULT FALSE,
    timestamp used_at,
    string ip_address,
    integer attempt_count DEFAULT 0,
    timestamp last_attempt_at
);
```

### New FAMILY_INVITATIONS Table
```sql
CREATE TABLE FAMILY_INVITATIONS (
    uuid id PK,
    string parent_email NOT NULL,
    json children_profiles, -- Array of child profile data
    string invitation_token UK,
    enum status "pending,partially_accepted,completed",
    timestamp sent_at,
    timestamp expires_at,
    json acceptance_log, -- Track which children have been claimed
    uuid invited_by FK
);
```

### Modified USERS Table
```sql
ALTER TABLE USERS ADD COLUMN:
- uuid invitation_id FK, -- Link to original invitation
- boolean requires_otp DEFAULT TRUE, -- OTP requirement flag
- timestamp last_otp_sent,
- integer daily_otp_count DEFAULT 0,
- date last_otp_reset_date
```

## Implementation Components

### 1. Invitation Management Service
```typescript
interface InvitationService {
  createInvitation(invitationData: InvitationRequest): Promise<Invitation>;
  sendInvitation(invitationId: string): Promise<void>;
  validateInvitationToken(token: string): Promise<InvitationValidation>;
  acceptInvitation(token: string, userData: UserRegistrationData): Promise<User>;
  resendInvitation(invitationId: string): Promise<void>;
  revokeInvitation(invitationId: string): Promise<void>;
  getInvitationStatus(token: string): Promise<InvitationStatus>;
}

interface InvitationRequest {
  email: string;
  type: 'alumni' | 'family_member' | 'admin';
  invitedBy: string;
  data: {
    graduationYear?: number;
    relationship?: string;
    expectedProfiles?: number;
  };
}

interface InvitationValidation {
  isValid: boolean;
  invitation: Invitation | null;
  errors: string[];
  requiresParentConsent: boolean;
}
```

### 2. OTP Management Service
```typescript
interface OTPService {
  generateOTP(email: string, type: OTPType): Promise<OTPToken>;
  sendOTP(email: string, otpCode: string, type: OTPType): Promise<void>;
  validateOTP(email: string, otpCode: string, type: OTPType): Promise<OTPValidation>;
  isOTPRequired(userId: string): Promise<boolean>;
  getRemainingOTPAttempts(email: string): Promise<number>;
  resetDailyOTPLimit(email: string): Promise<void>;
}

interface OTPToken {
  id: string;
  email: string;
  code: string;
  type: OTPType;
  expiresAt: Date;
}

interface OTPValidation {
  isValid: boolean;
  token: OTPToken | null;
  remainingAttempts: number;
  errors: string[];
}

type OTPType = 'login' | 'registration' | 'password_reset';
```

### 3. Family Invitation Service
```typescript
interface FamilyInvitationService {
  createFamilyInvitation(parentEmail: string, childrenData: ChildProfile[]): Promise<FamilyInvitation>;
  sendFamilyInvitation(invitationId: string): Promise<void>;
  getAvailableProfiles(token: string): Promise<ChildProfile[]>;
  selectChildProfile(token: string, profileId: string): Promise<ProfileSelection>;
  completeFamilyRegistration(selections: ProfileSelection[]): Promise<User[]>;
}

interface ChildProfile {
  id: string;
  name: string;
  graduationYear: number;
  program: string;
  isAvailable: boolean;
}

interface ProfileSelection {
  childProfileId: string;
  parentEmail: string;
  registrationData: UserRegistrationData;
}
```

## User Interface Components

### 1. Invitation Email Templates

#### Alumni Invitation Template
```html
<div class="invitation-email">
  <h1>Welcome to Gita Connect Alumni Network</h1>
  <p>You've been invited to join our global mahayagna family network.</p>
  <div class="invitation-details">
    <p><strong>Invitation Type:</strong> Alumni Member</p>
    <p><strong>Invited By:</strong> {{inviterName}}</p>
    <p><strong>Expires:</strong> {{expirationDate}}</p>
  </div>
  <a href="{{invitationLink}}" class="cta-button">Accept Invitation</a>
  <div class="legal-notice">
    <p>By accepting this invitation, you agree to our Terms of Service and Privacy Policy.</p>
  </div>
</div>
```

#### Family Invitation Template
```html
<div class="family-invitation-email">
  <h1>Your Children Have Been Invited to Gita Connect</h1>
  <p>Your children who graduated from our programs are eligible to join our alumni network.</p>
  <div class="children-list">
    {{#each children}}
    <div class="child-profile">
      <h3>{{name}}</h3>
      <p>Graduated: {{graduationYear}} - {{program}}</p>
    </div>
    {{/each}}
  </div>
  <a href="{{familyInvitationLink}}" class="cta-button">Manage Family Registration</a>
</div>
```

### 2. Registration Flow Components

#### Invitation Acceptance Page
- Invitation validation and display
- Terms and conditions acceptance
- Age verification integration
- Parent consent collection (if required)

#### Profile Selection Page (Family Invitations)
- List of available child profiles
- Selection interface for multiple children
- Individual registration forms
- Parent oversight controls

#### OTP Verification Page
- OTP input with validation
- Resend OTP functionality
- Attempt counter display
- Help and support links

## Email Integration

### 1. Email Service Configuration
```typescript
interface EmailService {
  sendInvitationEmail(invitation: Invitation): Promise<void>;
  sendOTPEmail(email: string, otpCode: string): Promise<void>;
  sendFamilyInvitationEmail(familyInvitation: FamilyInvitation): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
  trackEmailDelivery(emailId: string): Promise<EmailStatus>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}
```

### 2. Email Templates Management
- Responsive email templates
- Multi-language support preparation
- Brand consistency with platform
- Legal compliance text inclusion

## Security Implementation

### 1. Token Security
- Cryptographically secure token generation
- Time-based expiration (7 days for invitations)
- Single-use token validation
- IP address tracking for security

### 2. OTP Security
- 6-digit numeric codes
- 5-minute expiration
- Rate limiting (3 attempts per hour)
- Daily limit (10 OTPs per email)

### 3. Anti-Abuse Measures
- Email rate limiting
- Invitation spam prevention
- Suspicious activity detection
- Account lockout policies

## Security Enhancements

### 1. HMAC-SHA256 Token Signing
- Server-side secret key management for token signing
- Migration from plain tokens to HMAC-signed tokens
- Token format: `/invitation/[HMAC_TOKEN]`
- Enhanced forgery protection

### 2. Multi-Factor OTP Support
- TOTP authenticator app integration (Google Authenticator, Authy)
- SMS OTP preparation for AWS SES integration
- Admin UI OTP display for local testing
- Passwordless authentication flow integration

### 3. Server-Side Rate Limiting
- Redis-based rate limiting implementation
- Progressive delays and lockouts for abuse prevention
- Protection for OTP generation, invitations, and logins
- Removal of client-side rate limiting implementations

### 4. Database Encryption
- AES-256-GCM encryption for sensitive database columns
- AWS KMS key management integration
- Data migration strategy for existing data
- Encrypted fields: tokens, OTP codes, IP addresses, audit logs

## Local Testing Strategy

### Admin UI Testing Features
- Invitation URL display with copy-to-clipboard functionality
- OTP code visibility in admin interface for testing
- Complete passwordless flow testing without external services
- Local development environment support

### Testing Workflow
- Admin creates invitation → URL displayed in UI
- Tester clicks invitation link → Terms acceptance
- OTP code shown in admin UI → Manual entry for testing
- Full registration flow validation locally

## Code Cleanup and Migration

### Existing Implementation Audit
- Identify current token generation functions
- Catalog client-side rate limiting code
- Review OTP service implementations
- Document database schema encryption requirements

### Migration Strategy
- Phased implementation to minimize disruption
- Backward compatibility during transition
- Data migration scripts for encryption
- Systematic removal of redundant implementations

## Testing Strategy

### 1. Unit Tests
- Token generation and validation
- OTP creation and verification
- Email template rendering
- Security rule enforcement

### 2. Integration Tests
- End-to-end invitation flow
- Family invitation workflow
- OTP authentication process
- Email delivery confirmation

### 3. Security Tests
- Token security validation
- Rate limiting effectiveness
- Anti-abuse measure testing
- Data encryption verification

## Success Criteria

### Functional Requirements
- [ ] **Invitation Creation:** Admins can create and send invitations
- [ ] **Email Delivery:** 99%+ email delivery success rate
- [ ] **Token Validation:** Secure token validation with proper expiration
- [ ] **OTP System:** Functional OTP generation and validation
- [ ] **Family Support:** Multi-child invitation and registration support

### Authentication Requirements
- [ ] **Passwordless Flow:** Complete invitation → OTP → access without passwords
- [ ] **HMAC Token Security:** All tokens cryptographically signed and verified
- [ ] **Multi-Factor OTP:** TOTP authenticator support with SMS fallback
- [ ] **Server Rate Limiting:** Redis-based protection against brute force attacks
- [ ] **Database Encryption:** AES-256-GCM encryption for sensitive data

### Security Requirements
- [ ] **Token Security:** Cryptographically secure token generation
- [ ] **Rate Limiting:** Effective anti-abuse measures
- [ ] **Data Protection:** Secure handling of invitation and OTP data
- [ ] **Audit Trail:** Complete logging of invitation activities
- [ ] **Encryption Compliance:** GDPR-compliant data encryption and key management

### User Experience
- [ ] **Email Templates:** Professional, branded email communications
- [ ] **Registration Flow:** Intuitive invitation acceptance process
- [ ] **Family Experience:** Clear multi-child registration workflow
- [ ] **Mobile Support:** Full functionality on mobile devices

## Implementation Timeline

### Week 1: Security Foundation + Cleanup
- **Days 1-2:** HMAC token implementation and migration
- **Days 3-4:** Server-side rate limiting setup
- **Days 5-6:** Database encryption and data migration
- **Day 7:** Code cleanup and security audit

### Week 2: Passwordless Authentication + Migration
- **Days 1-2:** Multi-factor OTP implementation
- **Days 3-4:** Admin UI testing features
- **Days 5-6:** Passwordless flow integration
- **Day 7:** Migration testing and validation

### Week 3: Core Features + Final Cleanup
- **Days 1-2:** Family invitation enhancements
- **Days 3-4:** Email template updates
- **Days 5-6:** End-to-end testing
- **Day 7:** Documentation and handover

## Risk Mitigation

### Email Delivery Risks
- **Multiple Providers:** Backup email service providers
- **Deliverability:** SPF, DKIM, DMARC configuration
- **Monitoring:** Real-time delivery tracking

### Security Risks
- **Token Security:** Regular security audits
- **Rate Limiting:** Comprehensive abuse prevention
- **Data Protection:** Encryption and access controls

### User Experience Risks
- **Complexity:** Simple, guided workflows
- **Support:** Comprehensive help documentation
- **Accessibility:** WCAG 2.1 AA compliance

## Next Steps

1. **Security Foundation:** Implement HMAC token signing and server-side rate limiting
2. **Database Encryption:** Set up AES-256-GCM encryption for sensitive fields
3. **Code Cleanup:** Audit and remove redundant client-side implementations
4. **Multi-Factor OTP:** Add TOTP authenticator support and SMS preparation
5. **Admin UI Testing:** Build local testing features for invitation URLs and OTP codes
6. **Migration Strategy:** Plan and execute data migration for encryption
7. **Email Service Setup:** Configure reliable email delivery with security enhancements
8. **Database Implementation:** Create invitation and OTP tables with encryption
9. **Service Development:** Build core invitation and OTP services with security measures
10. **UI Development:** Create registration flow components with passwordless authentication
11. **Testing:** Comprehensive security testing and validation of all workflows

---

*This task establishes the secure, user-friendly invitation system that serves as the gateway to the Gita Connect platform.*
