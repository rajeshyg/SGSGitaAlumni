---
title: External Services
version: 1.0
status: active
last_updated: 2025-11-23
category: integration
---

# External Service Integrations

## Email Service

### Providers Supported

The email service supports multiple SMTP providers:

| Provider | Configuration | Use Case |
|----------|--------------|----------|
| SendGrid | Default | Production recommended |
| AWS SES | Enterprise | High volume |
| Gmail | Development | Testing only |
| Custom SMTP | Configurable | Self-hosted |

### Configuration

From `/routes/email.js`:

```javascript
function createTransporter() {
  const provider = process.env.SMTP_PROVIDER || 'sendgrid';

  switch (provider) {
    case 'sendgrid':
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'apikey',
          pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
        }
      });

    case 'aws-ses':
      return nodemailer.createTransporter({
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    // ... other providers
  }
}
```

### Environment Variables

```bash
SMTP_PROVIDER=sendgrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

### Email Types

```javascript
const EMAIL_TYPES = {
  invitation: 'invitation',
  otp: 'otp',
  welcome: 'welcome',
  family_invitation: 'family_invitation',
  parent_consent: 'parent_consent'
};
```

### Email Templates

Built-in templates with HTML and text versions:
- `otp-verification` - OTP code delivery
- `alumni-invitation` - Invitation to join

Example template:
```javascript
'otp-verification': {
  subject: 'Your Verification Code',
  html: (data) => `
    <div style="font-family: Arial, sans-serif;">
      <h1>Your Verification Code</h1>
      <div style="background-color: #f0f0f0; padding: 20px;">
        <h2>${data.otpCode}</h2>
      </div>
      <p>This code expires in ${data.expirationMinutes} minutes.</p>
    </div>
  `
}
```

### API Endpoints

- `POST /api/email/send` - Send email (rate limited)
- `GET /api/email/delivery/:emailId` - Check delivery status
- `GET /api/email/templates/:templateId` - Get template

## OTP Service

### Overview

One-Time Password service for authentication with rate limiting and expiry.

From `/routes/otp.js`:

```javascript
// Generate cryptographically secure OTP
function generateRandomOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}
```

### Rate Limiting

- Maximum 3 OTP requests per hour per email
- Configurable expiry (default 5 minutes)
- Daily count tracking

```javascript
// Rate limit check
const [rateLimitRows] = await connection.execute(`
  SELECT COUNT(*) as attempts
  FROM OTP_TOKENS
  WHERE email = ?
    AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
`, [email]);

if (attempts >= 3) {
  return res.status(429).json({
    error: 'Rate limit exceeded'
  });
}
```

### OTP Types

```javascript
const validTokenTypes = ['login', 'registration', 'password_reset', 'email'];
```

### API Endpoints

- `POST /api/otp/generate` - Generate and send OTP
- `POST /api/otp/validate` - Validate OTP code
- `GET /api/otp/remaining-attempts/:email` - Check remaining attempts
- `GET /api/otp/daily-count/:email` - Get daily count
- `GET /api/otp/rate-limit/:email` - Check rate limit status
- `DELETE /api/otp/cleanup-expired` - Clean expired tokens

### TOTP Support

Time-based One-Time Password for multi-factor auth:
- `POST /api/users/totp/setup` - Setup TOTP
- `GET /api/users/totp/status/:email` - Get TOTP status

## Database Connection

### Connection Pooling

From `/utils/database.js`:

```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Pool Monitoring

```javascript
// Monitor pool health every 60 seconds
startPoolMonitoring(60000);
```

## Redis (Optional)

### Rate Limiting

From `/src/lib/security/RedisRateLimiter.ts`:

Used for distributed rate limiting across server instances.

```javascript
import { redisRateLimiter } from './src/lib/security/RedisRateLimiter.ts';

// Falls back to in-memory if Redis unavailable
if (redisAvailable) {
  console.log('Redis rate limiter ready');
} else {
  console.warn('Using in-memory rate limiting fallback');
}
```

## File Storage

Currently using local filesystem. Future considerations:
- AWS S3 for file uploads
- CloudFront CDN for media delivery

## Error Tracking

### Sentry Integration

Recommended for production error tracking:

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## Related Files

- Email routes: `/routes/email.js`
- OTP routes: `/routes/otp.js`
- Email utility: `/utils/emailService.js`
- Database: `/utils/database.js`
- Rate limiter: `/src/lib/security/RedisRateLimiter.ts`
