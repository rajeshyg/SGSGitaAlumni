# Task 8.2.2: Multi-Factor OTP Implementation

**Status:** � Backend Complete - Integration Pending
**Priority:** High
**Duration:** 3 days
**Dependencies:** Task 8.2.1 (HMAC Tokens)
**Last Updated:** October 11, 2025

## Overview

Implement multi-factor OTP authentication with TOTP authenticator app support and SMS OTP preparation for AWS SES integration. This task enhances the passwordless authentication system with additional security layers and provides Admin UI testing capabilities for local development.

## 📊 Current Implementation Status

### ✅ **COMPLETED - Core Services**

#### **TOTP Implementation**
- ✅ **TOTPService** (`src/lib/auth/TOTPService.ts`)
  - Base32 secret generation using crypto.randomBytes
  - RFC 6238 compliant time-based OTP generation
  - TOTP verification with configurable time window (±1 step default)
  - QR code URL generation for authenticator app setup
  - Support for SHA1, SHA256, SHA512 algorithms
  - Configurable digit length (6 or 8 digits)
  - 30-second time step period
  - Compatible with Google Authenticator, Authy, Microsoft Authenticator

#### **SMS OTP Infrastructure**
- ✅ **SMSOTPService** (`src/lib/auth/SMSOTPService.ts`)
  - Multi-provider architecture (AWS SNS, Twilio, local-test)
  - SMS message formatting and sending
  - Rate limiting configuration (per minute, hour, day)
  - Delivery result tracking
  - Local testing mode for development
  - Ready for production SMS provider integration
  - Phone number validation (E.164 format)

#### **Multi-Factor Service Integration**
- ✅ **MultiFactorOTPService** (`src/services/MultiFactorOTPService.ts`)
  - Unified interface for email, SMS, and TOTP
  - User profile integration for phone number lookup
  - TOTP setup workflow with secret generation
  - Method-specific result handling
  - Backward compatibility with existing email OTP
  - Multi-method OTP generation support

#### **OTP Service Extensions**
- ✅ **Enhanced OTPService** (`src/services/OTPService.ts`)
  - Multi-factor OTP generation method added
  - Support for email, SMS, and TOTP in single request
  - Integration with TOTPService and SMSOTPService
  - Method-specific error handling and results

### ✅ **COMPLETED - Database & API**

#### **Database Schema**
- ✅ **OTP_TOKENS Table Extensions**
  ```sql
  -- Multi-method support columns
  otp_method VARCHAR(20) DEFAULT 'email'
  phone_number VARCHAR(20)
  verification_attempts INTEGER DEFAULT 0
  last_verification_attempt TIMESTAMP
  ```
- ✅ **USER_TOTP_SECRETS Table** (via migration script)
  ```sql
  CREATE TABLE USER_TOTP_SECRETS (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    secret VARCHAR(32) NOT NULL,
    backup_codes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE
  )
  ```
- ✅ **Migration Script** (`scripts/database/migrate-multi-factor-otp.sql`)

#### **API Endpoints**
- ✅ **TOTP Endpoints** (`routes/otp.js`, `server.js`)
  - `POST /api/users/totp/setup` - Setup TOTP for user
  - `GET /api/users/totp/status/:email` - Get TOTP status
  - `GET /api/users/profile/:email` - Get user OTP settings
- ✅ **Base OTP Endpoints** (from Task 7.3)
  - All existing OTP endpoints support multi-method parameter

### ✅ **COMPLETED - Frontend Components**

#### **OTP Verification UI**
- ✅ **Multi-Method Support** (`src/pages/OTPVerificationPage.tsx`)
  - Method selection dropdown (email, SMS, TOTP)
  - TOTP verification flow
  - Email OTP verification flow
  - SMS OTP verification flow (ready for backend integration)
  - Method-specific UI adjustments
  - Remaining attempts display per method

### 🔄 **IN PROGRESS - Admin UI Integration**

#### **Admin OTP Testing Panel**
- 🔄 **Testing Interface** - Needs implementation
  - Display generated OTP codes for local testing
  - Copy-to-clipboard functionality
  - TOTP QR code display
  - Test OTP generation for all methods
  - SMS delivery status display

### 🟡 **PENDING - Production Integration**

#### **Email Service Configuration**
- 🟡 **Production Email Provider**
  - Configure SendGrid or AWS SES for invitation emails
  - Set up email templates for OTP delivery
  - Configure email delivery monitoring
  - Set up bounce and complaint handling

#### **SMS Service Configuration**
- 🟡 **AWS SNS or Twilio Integration**
  - Configure production SMS provider credentials
  - Set up SMS delivery monitoring
  - Configure rate limiting for production
  - Test SMS delivery with real phone numbers

#### **TOTP Backup Codes**
- 🟡 **Backup Recovery System**
  - Generate backup recovery codes on TOTP setup
  - Securely store encrypted backup codes
  - Implement backup code verification
  - Create backup code regeneration workflow

### 📋 **Session Resumption Guide**

To resume multi-factor OTP implementation:

1. **Review Completed Implementation:**
   ```bash
   # Core services
   src/lib/auth/TOTPService.ts           # TOTP generation/verification
   src/lib/auth/SMSOTPService.ts         # SMS OTP sending
   src/services/MultiFactorOTPService.ts # Unified interface
   
   # Database & API
   scripts/database/migrate-multi-factor-otp.sql  # Schema migration
   routes/otp.js                         # API endpoints
   
   # Frontend
   src/pages/OTPVerificationPage.tsx    # Multi-method UI
   ```

2. **Next Implementation Tasks:**
   - 🔄 Create Admin OTP testing panel component
   - 🔄 Integrate TOTP QR code display in admin UI
   - 🔄 Configure production email provider
   - 🔄 Configure production SMS provider
   - 🔄 Implement backup code generation and recovery

3. **Testing Checklist:**
   - ✅ TOTP generation and verification (unit tested)
   - ✅ SMS OTP local testing mode works
   - 🟡 Email OTP delivery (needs email provider)
   - 🟡 SMS OTP delivery (needs SMS provider)
   - 🟡 Admin UI OTP display
   - 🟡 Multi-method selection and verification
   - 🟡 Backup code generation and usage

4. **Environment Variables Required:**
   ```bash
   # Email provider (SendGrid or AWS SES)
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   
   # SMS provider (AWS SNS)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   SMS_SENDER_ID=GitaConnect
   
   # Or Twilio
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

5. **Files to Create/Modify Next:**
   - `src/components/admin/OTPTestPanel.tsx` - Create admin testing UI
   - `src/lib/email/EmailService.ts` - Configure for production
   - `src/lib/auth/BackupCodeService.ts` - Create backup code system
   - `src/components/auth/TOTPSetupModal.tsx` - TOTP setup UI

## Objectives

- Add TOTP authenticator app support (Google Authenticator, Authy)
- Prepare SMS OTP infrastructure for AWS SES integration
- Implement Admin UI OTP display for local testing
- Integrate multi-factor authentication into passwordless flow
- Ensure backward compatibility with existing email OTP

## Technical Implementation Details

### TOTP Implementation

```typescript
interface TOTPConfig {
  secret: string; // Base32 encoded secret
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: 30; // seconds
}

class TOTPService {
  generateSecret(): string {
    return base32.encode(crypto.randomBytes(20)).replace(/=/g, '');
  }

  generateTOTP(secret: string, timeStep: number = 30): string {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const secretBuffer = base32.decode(secret);

    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'));

    const hmacResult = hmac.digest();
    const offset = hmacResult[hmacResult.length - 1] & 0xf;

    const code = (
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  }

  verifyTOTP(token: string, secret: string, window: number = 1): boolean {
    const currentTime = Math.floor(Date.now() / 1000 / 30);

    for (let i = -window; i <= window; i++) {
      const testTime = currentTime + i;
      if (this.generateTOTP(secret, 30) === token) {
        return true;
      }
    }

    return false;
  }

  generateQRCodeURL(secret: string, accountName: string, issuer: string = 'Gita Connect'): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
  }
}
```

### SMS OTP Preparation

```typescript
interface SMSOTPConfig {
  provider: 'aws-ses' | 'twilio' | 'local-test';
  region?: string;
  senderId: string;
  rateLimit: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
}

class SMSOTPService {
  private config: SMSOTPConfig;

  async sendSMSOTP(phoneNumber: string, otpCode: string): Promise<SMSResult> {
    const message = `Your Gita Connect verification code is: ${otpCode}. Valid for 5 minutes.`;

    switch (this.config.provider) {
      case 'aws-ses':
        return await this.sendViaAWSSES(phoneNumber, message);
      case 'twilio':
        return await this.sendViaTwilio(phoneNumber, message);
      case 'local-test':
        return await this.sendLocalTest(phoneNumber, message);
      default:
        throw new Error('Unsupported SMS provider');
    }
  }

  private async sendViaAWSSES(phoneNumber: string, message: string): Promise<SMSResult> {
    // AWS SES SMS implementation
    const ses = new AWS.SES({ region: this.config.region });

    try {
      const result = await ses.sendTextMessage({
        DestinationPhoneNumber: phoneNumber,
        Message: message,
        SourcePhoneNumber: this.config.senderId
      }).promise();

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-ses'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'aws-ses'
      };
    }
  }

  private async sendLocalTest(phoneNumber: string, message: string): Promise<SMSResult> {
    // Local testing - log to console/Admin UI
    console.log(`[SMS TEST] To: ${phoneNumber} Message: ${message}`);

    // Store in test database for Admin UI display
    await this.storeTestSMS(phoneNumber, message);

    return {
      success: true,
      messageId: `test-${Date.now()}`,
      provider: 'local-test'
    };
  }
}
```

### Admin UI OTP Display

```typescript
interface AdminOTPTestData {
  email: string;
  otpCode: string;
  generatedAt: Date;
  expiresAt: Date;
  type: 'email' | 'sms' | 'totp';
  testUrl?: string; // For local testing
}

// Admin UI Component
const OTPTestPanel = () => {
  const [testData, setTestData] = useState<AdminOTPTestData[]>([]);

  const generateTestOTP = async (email: string, type: 'email' | 'sms' | 'totp') => {
    const otpData = await adminApi.generateTestOTP(email, type);

    setTestData(prev => [...prev, {
      ...otpData,
      testUrl: type === 'email' ? `/otp-test?code=${otpData.otpCode}&email=${email}` : undefined
    }]);
  };

  return (
    <div className="otp-test-panel">
      <h3>OTP Testing Panel</h3>

      <div className="test-controls">
        <input
          type="email"
          placeholder="Test email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
        />

        <button onClick={() => generateTestOTP(testEmail, 'email')}>
          Generate Email OTP
        </button>

        <button onClick={() => generateTestOTP(testEmail, 'sms')}>
          Generate SMS OTP
        </button>

        <button onClick={() => generateTestOTP(testEmail, 'totp')}>
          Setup TOTP
        </button>
      </div>

      <div className="test-results">
        {testData.map((item, index) => (
          <div key={index} className="otp-item">
            <div className="otp-info">
              <strong>{item.type.toUpperCase()}:</strong> {item.otpCode}
              <br />
              <small>Expires: {item.expiresAt.toLocaleTimeString()}</small>
            </div>

            {item.testUrl && (
              <a href={item.testUrl} target="_blank" className="test-link">
                Test Link
              </a>
            )}

            <button
              onClick={() => navigator.clipboard.writeText(item.otpCode)}
              className="copy-btn"
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Code Changes Required

### 1. New Files to Create

**`src/lib/auth/TOTPService.ts`**
- TOTP generation and verification
- QR code URL generation
- Base32 encoding/decoding utilities

**`src/lib/auth/SMSOTPService.ts`**
- SMS sending abstraction
- AWS SES integration
- Local testing mode

**`src/components/admin/OTPTestPanel.tsx`**
- Admin UI component for OTP testing
- Copy-to-clipboard functionality
- Test link generation

**`src/services/MultiFactorOTPService.ts`**
- Unified OTP service interface
- Support for email, SMS, and TOTP
- Rate limiting integration

### 2. Files to Modify

**`src/services/OTPService.ts`**
```typescript
// Extend existing OTP service
export class EnhancedOTPService extends OTPService {
  private totpService: TOTPService;
  private smsService: SMSOTPService;

  async generateMultiFactorOTP(
    email: string,
    methods: ('email' | 'sms' | 'totp')[]
  ): Promise<MultiFactorOTPResult> {
    const results = [];

    for (const method of methods) {
      switch (method) {
        case 'email':
          results.push(await this.generateEmailOTP(email));
          break;
        case 'sms':
          results.push(await this.generateSMSOTP(email));
          break;
        case 'totp':
          results.push(await this.setupTOTP(email));
          break;
      }
    }

    return { methods: results };
  }
}
```

**`src/pages/OTPVerificationPage.tsx`**
```typescript
// Add TOTP verification option
const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms' | 'totp'>('email');

const verifyOTP = async () => {
  let isValid = false;

  switch (verificationMethod) {
    case 'email':
    case 'sms':
      isValid = await otpService.validateOTP(email, otpCode, verificationMethod);
      break;
    case 'totp':
      isValid = totpService.verifyTOTP(otpCode, userTotpSecret);
      break;
  }

  if (isValid) {
    // Complete authentication
    await completeLogin();
  }
};
```

### 3. Database Schema Updates

```sql
-- Extend OTP_TOKENS table for multi-factor support
ALTER TABLE OTP_TOKENS
ADD COLUMN otp_method VARCHAR(20) DEFAULT 'email',
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN totp_secret VARCHAR(32),
ADD COLUMN verification_attempts INTEGER DEFAULT 0,
ADD COLUMN last_verification_attempt TIMESTAMP;

-- Add TOTP secrets table
CREATE TABLE USER_TOTP_SECRETS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
    secret VARCHAR(32) NOT NULL,
    backup_codes TEXT[], -- Encrypted backup codes
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE UNIQUE INDEX idx_user_totp_secrets_user_id ON USER_TOTP_SECRETS(user_id);
CREATE INDEX idx_otp_tokens_method ON OTP_TOKENS(otp_method);
```

## Testing Strategy

### Unit Tests

**`src/lib/auth/__tests__/TOTPService.test.ts`**
```typescript
describe('TOTPService', () => {
  it('should generate valid TOTP codes', () => {
    const secret = service.generateSecret();
    const code = service.generateTOTP(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should verify correct TOTP codes', () => {
    const secret = service.generateSecret();
    const code = service.generateTOTP(secret);
    expect(service.verifyTOTP(code, secret)).toBe(true);
  });

  it('should reject invalid TOTP codes', () => {
    const secret = service.generateSecret();
    expect(service.verifyTOTP('000000', secret)).toBe(false);
  });

  it('should generate valid QR code URLs', () => {
    const secret = service.generateSecret();
    const url = service.generateQRCodeURL(secret, 'test@example.com');
    expect(url).toContain('otpauth://totp/');
  });
});
```

### Integration Tests

**`tests/api/multi-factor-otp.test.ts`**
```typescript
describe('Multi-Factor OTP Flow', () => {
  it('should generate and verify email OTP', async () => {
    const result = await generateOTP('test@example.com', 'email');
    expect(result.success).toBe(true);

    const verification = await verifyOTP('test@example.com', result.code, 'email');
    expect(verification.valid).toBe(true);
  });

  it('should setup and verify TOTP', async () => {
    const setup = await setupTOTP('test@example.com');
    expect(setup.secret).toBeDefined();
    expect(setup.qrCodeUrl).toBeDefined();

    const code = generateTOTP(setup.secret);
    const verification = await verifyTOTP('test@example.com', code);
    expect(verification.valid).toBe(true);
  });

  it('should handle SMS OTP in test mode', async () => {
    const result = await generateOTP('+1234567890', 'sms');
    expect(result.success).toBe(true);

    // Check test SMS was stored
    const testSMS = await getTestSMS('+1234567890');
    expect(testSMS).toContain('verification code');
  });
});
```

### Local Admin UI Testing

- **OTP Generation:** Admin can generate test OTPs for any method
- **Code Display:** OTP codes shown in Admin UI for manual testing
- **Copy Functionality:** One-click copy to clipboard
- **Test Links:** Direct links for testing email OTP flow
- **TOTP Setup:** QR code display for authenticator app setup

## Success Criteria

### Functional Requirements
- [ ] **TOTP Generation:** Valid TOTP codes generated and verified
- [ ] **QR Code Support:** QR codes for authenticator app setup
- [ ] **SMS Preparation:** SMS OTP infrastructure ready for AWS SES
- [ ] **Admin UI Testing:** OTP codes displayed in Admin interface
- [ ] **Multi-Method Support:** Email, SMS, and TOTP authentication
- [ ] **Passwordless Integration:** Multi-factor OTP in passwordless flow

### Security Requirements
- [ ] **TOTP Security:** Proper time-based code generation
- [ ] **Secret Management:** TOTP secrets securely stored and encrypted
- [ ] **Rate Limiting:** OTP generation rate limits enforced
- [ ] **Attempt Limits:** Maximum verification attempts per OTP
- [ ] **Audit Logging:** All OTP operations logged

### User Experience Requirements
- [ ] **Easy Setup:** Simple TOTP authenticator app setup
- [ ] **Backup Codes:** Recovery codes for TOTP lockout
- [ ] **Method Choice:** User can choose preferred OTP method
- [ ] **Clear Instructions:** Setup instructions for each method
- [ ] **Error Handling:** Clear error messages for failed verification

## Dependencies and Blockers

### Dependencies
- Task 8.2.1 (HMAC Tokens) - for secure token management
- AWS SES configuration (for SMS in production)
- QR code generation library (qrcode package)
- Base32 encoding library (base32.js or similar)

### Blockers
- SMS provider setup (AWS SES or Twilio)
- Mobile testing for TOTP authenticator apps
- Admin UI access for testing

## Risk Mitigation

### Security Risks
- **TOTP Secret Exposure:** Encrypt secrets at rest
- **SMS Interception:** Use secure SMS providers
- **Rate Limit Bypass:** Server-side rate limiting
- **OTP Reuse:** One-time use enforcement
- **Timing Attacks:** Constant-time verification

### Implementation Risks
- **TOTP Clock Sync:** Allow time window for verification
- **SMS Delivery:** Fallback to email if SMS fails
- **QR Code Scanning:** Ensure QR codes work with all apps
- **Backup Recovery:** Provide recovery mechanisms

### Operational Risks
- **SMS Costs:** Monitor and control SMS usage
- **TOTP Support:** User education for authenticator apps
- **Admin Testing:** Secure Admin UI access
- **Migration:** Backward compatibility during rollout

---

*This task implements comprehensive multi-factor OTP authentication to enhance the security of the passwordless authentication system.*