# API Endpoints Documentation

**Status:** ✅ ALIGNED WITH CURRENT IMPLEMENTATION
**Date:** October 12, 2025
**Version:** 1.1.0 - Added Comprehensive OTP Endpoints Documentation

## Data Model Separation

### 1. Alumni Members (Source Data)
**Purpose:** Original alumni data from CSV imports
**Management:** Admin-only contact information editing
**Endpoint Pattern:** `/api/alumni-members/*`

### 2. App Users (Authentication)
**Purpose:** Platform user accounts and authentication
**Management:** Admin status and permission management
**Endpoint Pattern:** `/api/users/*`

### 3. User Profiles (Extended Information)
**Purpose:** Extended user profiles and personalization
**Management:** User self-management with admin oversight
**Endpoint Pattern:** `/api/user-profiles/*`

## API Endpoints

### Alumni Members Endpoints (Source Data)

#### Get Alumni Member
```http
GET /api/alumni-members/{memberId}
```

**Response:**
```json
{
  "id": "member-id",
  "studentId": "STU001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "123-456-7890",
  "graduationYear": 2020,
  "degree": "Bachelor of Science",
  "department": "Computer Science",
  "address": "123 Main St, City, State",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### Search Alumni Members
```http
GET /api/alumni-members/search?q={query}&limit={limit}
```

**Parameters:**
- `q` (string): Search query (name, email, student ID)
- `limit` (number, optional): Maximum results (default: 50)

**Response:**
```json
[
  {
    "id": "member-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "graduationYear": 2020,
    "degree": "Bachelor of Science",
    "department": "Computer Science"
  }
]
```

#### Update Alumni Member
```http
PUT /api/alumni-members/{memberId}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "phone": "123-456-7890",
  "address": "123 Main St, City, State"
}
```

### App Users Endpoints (Authentication)

#### Get Current User
```http
GET /api/users/me
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "member",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLoginAt": "2025-01-01T12:00:00Z"
}
```

#### Get App User (Admin)
```http
GET /api/users/{userId}
```

#### Search App Users (Admin)
```http
GET /api/users/search?q={query}&limit={limit}
```

#### Update App User (Admin)
```http
PUT /api/users/{userId}
Content-Type: application/json

{
  "status": "active",
  "email": "user@example.com"
}
```

### User Profiles Endpoints (Extended Information)

#### Get User Profile
```http
GET /api/user-profiles/{userId}
```

**Response:**
```json
{
  "id": "profile-id",
  "userId": "user-id",
  "alumniMemberId": "member-id",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "bio": "Software engineer passionate about technology",
  "avatarUrl": "https://example.com/avatar.jpg",
  "phone": "123-456-7890",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "twitter": "https://twitter.com/johndoe"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### Update User Profile
```http
PUT /api/user-profiles/{userId}
Content-Type: application/json

{
  "displayName": "John Doe",
  "bio": "Software engineer passionate about technology",
  "socialLinks": {
    "linkedin": "https://linkedin.com/in/johndoe"
  }
}
```

#### Link User to Alumni Member
```http
POST /api/user-profiles/{userId}/link-alumni
Content-Type: application/json

{
  "alumniMemberId": "member-id"
}
```

### Directory & Search Endpoints

#### Search Alumni
```http
POST /api/alumni/search
Content-Type: application/json

{
  "graduationYear": [2020, 2021],
  "major": ["Computer Science"],
  "location": ["New York"],
  "searchTerm": "john"
}
```

**Response:**
```json
[
  {
    "id": "result-id",
    "firstName": "John",
    "lastName": "Doe",
    "graduationYear": 2020,
    "major": "Computer Science",
    "currentPosition": "Software Engineer",
    "company": "Tech Corp",
    "location": "New York",
    "profileImageUrl": "https://example.com/profile.jpg"
  }
]
```

#### Get Alumni Directory
```http
POST /api/alumni/directory
Content-Type: application/json

{
  "page": 1,
  "pageSize": 20,
  "filters": {
    "graduationYear": [2020],
    "major": ["Computer Science"]
  },
  "sortBy": "name",
  "sortOrder": "asc"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "result-id",
      "firstName": "John",
      "lastName": "Doe",
      "graduationYear": 2020,
      "major": "Computer Science",
      "currentPosition": "Software Engineer",
      "company": "Tech Corp",
      "location": "New York"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "filters": {
    "graduationYear": [2020],
    "major": ["Computer Science"]
  }
}
```

### Invitation Management Endpoints

#### Create Individual Invitation
```http
POST /api/invitations
Content-Type: application/json

{
  "email": "user@example.com",
  "invitedBy": "admin-user-id",
  "invitationType": "alumni",
  "invitationData": {
    "graduationYear": 2020,
    "major": "Computer Science"
  },
  "expiresAt": "2025-10-07T00:00:00Z"
}
```

#### Create Family Invitation
```http
POST /api/invitations/family
Content-Type: application/json

{
  "parentEmail": "parent@example.com",
  "childrenData": [
    {
      "name": "John Doe",
      "graduationYear": 2020,
      "program": "Computer Science"
    }
  ],
  "invitedBy": "admin-user-id",
  "expiresInDays": 7
}
```

#### Create Bulk Invitations
```http
POST /api/invitations/bulk
Content-Type: application/json

{
  "invitations": [
    {
      "userId": "user-id-1",
      "invitationType": "profile_completion",
      "expiresAt": "2025-10-07T00:00:00Z",
      "invitedBy": "admin-user-id"
    }
  ]
}
```

#### Get Invitations (Admin)
```http
GET /api/invitations?page=1&pageSize=20&status=pending
```

#### Get Family Invitations (Admin)
```http
GET /api/invitations/family?page=1&pageSize=20&status=pending
```

#### Resend Invitation
```http
POST /api/invitations/{invitationId}/resend
```

#### Revoke Invitation
```http
PUT /api/invitations/{invitationId}/revoke
```

### User Management Endpoints

#### Update User Attributes
```http
PUT /api/users/{userId}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "birthDate": "2000-01-01",
  "graduationYear": 2020,
  "program": "Computer Science",
  "currentPosition": "Software Engineer",
  "bio": "Passionate software engineer",
  "ageVerified": true,
  "parentConsentRequired": false,
  "parentConsentGiven": false,
  "requiresOtp": true
}
```

#### Send Invitation to User
```http
POST /api/users/{userId}/send-invitation
Content-Type: application/json

{
  "invitationType": "profile_completion",
  "expiresInDays": 7
}
```

#### Send Invitation to Alumni Member
```http
POST /api/alumni-members/{alumniMemberId}/send-invitation
Content-Type: application/json

{
  "invitationType": "alumni",
  "expiresInDays": 7
}
```

### Posting Endpoints

#### Get Postings with Filters
```http
POST /api/postings/search
Content-Type: application/json

{
  "type": "job",
  "category": ["Technology"],
  "location": ["New York"],
  "searchTerm": "software engineer"
}
```

#### Create Posting
```http
POST /api/postings
Content-Type: application/json

{
  "title": "Software Engineer Position",
  "description": "We are looking for a talented software engineer...",
  "type": "job",
  "category": "Technology",
  "location": "New York",
  "company": "Tech Corp",
  "salary": "$80,000 - $120,000",
  "requirements": ["Bachelor's degree", "3+ years experience"],
  "benefits": ["Health insurance", "401k"],
  "applicationUrl": "https://company.com/apply",
  "deadline": "2025-12-31"
}
```

#### Update Posting
```http
PUT /api/postings/{postingId}
Content-Type: application/json

{
  "title": "Updated Job Title",
  "isActive": true
}
```

### OTP Authentication Endpoints

#### Generate and Send OTP
```http
POST /api/otp/generate
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "login"
}
```

**Description:** Generates a new OTP code and sends it via email. This endpoint combines generation and sending in one step.

**Request Body:**
- `email` (string, required): Email address to send OTP to
- `type` (string, optional): OTP type - `login`, `registration`, or `password_reset` (default: `email`)

**Rate Limits:**
- **Hourly:** 3 OTP requests per email address
- **Daily:** 10 OTP requests per email address

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "code": "123456",
  "expiresAt": "2025-10-12T15:30:00.000Z",
  "remainingAttempts": 3,
  "message": "OTP sent successfully to user@example.com"
}
```

**Response (Rate Limit Exceeded - 429 Too Many Requests):**
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "remainingAttempts": 0
}
```

**Response (Daily Limit Exceeded - 429 Too Many Requests):**
```json
{
  "error": "Daily OTP limit exceeded. Please try again tomorrow.",
  "remainingAttempts": 0
}
```

**Notes:**
- OTP code is 6 digits
- Default expiry: 5 minutes (configurable via `OTP_EXPIRY_MINUTES` environment variable)
- In development mode, OTP code is logged to console
- Email sending errors are logged but don't fail the request

**Status:** ✅ Implemented and tested

---

#### Validate OTP
```http
POST /api/otp/validate
Content-Type: application/json

{
  "email": "user@example.com",
  "otpCode": "123456",
  "tokenType": "login"
}
```

**Description:** Validates an OTP code against the database.

**Request Body:**
- `email` (string, required): Email address associated with the OTP
- `otpCode` (string, required): 6-digit OTP code to validate
- `tokenType` (string, required): OTP type - `login`, `registration`, or `password_reset`

**Response (Valid OTP - 200 OK):**
```json
{
  "success": true,
  "message": "OTP validated successfully",
  "remainingAttempts": 3
}
```

**Response (Invalid OTP - 400 Bad Request):**
```json
{
  "error": "Invalid OTP code",
  "remainingAttempts": 2
}
```

**Response (Expired OTP - 410 Gone):**
```json
{
  "error": "OTP has expired. Please request a new one.",
  "remainingAttempts": 0
}
```

**Response (OTP Already Used - 400 Bad Request):**
```json
{
  "error": "OTP has already been used",
  "remainingAttempts": 0
}
```

**Response (Max Attempts Exceeded - 429 Too Many Requests):**
```json
{
  "error": "Maximum validation attempts exceeded",
  "remainingAttempts": 0
}
```

**Security Features:**
- Maximum 3 validation attempts per OTP
- OTP marked as used after successful validation
- Attempt count incremented on each failed validation
- IP address tracking for security monitoring

**Status:** ✅ Implemented and tested

---

#### Get Active OTP
```http
GET /api/otp/active/:email
Authorization: Bearer {admin-token}
```

**Description:** Retrieves the currently active (unexpired and unused) OTP for a given email address. **Admin only endpoint.**

**Parameters:**
- `email` (string, required): Email address to check for active OTP

**Authorization:**
- Requires admin role
- Returns 403 Forbidden if not authorized

**Response (Active OTP Found - 200 OK):**
```json
{
  "hasActiveOtp": true,
  "code": "123456",
  "expiresAt": "2025-10-12T15:30:00.000Z",
  "tokenType": "login"
}
```

**Response (No Active OTP - 404 Not Found):**
```json
{
  "message": "No active OTP found",
  "hasActiveOtp": false
}
```

**Use Cases:**
- Admin testing and debugging
- Support team assisting users with login issues
- Invitation workflow testing

**Status:** ✅ Implemented and tested

---

#### Check Rate Limit
```http
GET /api/otp/rate-limit/:email
```

**Description:** Checks the current rate limit status for an email address.

**Parameters:**
- `email` (string, required): Email address to check

**Response:**
```json
{
  "allowed": true,
  "hourlyCount": 1,
  "hourlyLimit": 3,
  "message": "2 requests remaining in the next hour"
}
```

**Status:** ✅ Implemented

---

#### Get Remaining Attempts
```http
GET /api/otp/remaining-attempts/:email
```

**Description:** Gets the number of remaining validation attempts for the most recent OTP.

**Parameters:**
- `email` (string, required): Email address to check

**Response:**
```json
{
  "remainingAttempts": 3,
  "maxAttempts": 3
}
```

**Status:** ✅ Implemented

---

#### Get Daily Count
```http
GET /api/otp/daily-count/:email
```

**Description:** Gets the number of OTP requests made in the last 24 hours.

**Parameters:**
- `email` (string, required): Email address to check

**Response:**
```json
{
  "count": 2,
  "limit": 10,
  "remaining": 8
}
```

**Status:** ✅ Implemented

---

#### Cleanup Expired OTPs
```http
DELETE /api/otp/cleanup-expired
Authorization: Bearer {admin-token}
```

**Description:** Manually triggers cleanup of expired OTP tokens. **Admin only endpoint.**

**Authorization:**
- Requires admin role
- Returns 403 Forbidden if not authorized

**Response:**
```json
{
  "success": true,
  "deletedCount": 15,
  "message": "Cleanup completed successfully"
}
```

**Cleanup Rules:**
- Deletes OTPs where `expires_at < NOW()`
- Deletes used OTPs older than 24 hours
- Deletes locked OTPs older than 24 hours

**Status:** ✅ Implemented

---

#### OTP Endpoint Usage Examples

**Example 1: Complete Login Flow with OTP**

```javascript
// Step 1: Request OTP
const generateResponse = await fetch('/api/otp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    type: 'login'
  })
});

const otpData = await generateResponse.json();
console.log(`OTP sent! Expires at: ${otpData.expiresAt}`);

// Step 2: User enters OTP code (from email)
const userEnteredCode = '123456';

// Step 3: Validate OTP
const validateResponse = await fetch('/api/otp/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otpCode: userEnteredCode,
    tokenType: 'login'
  })
});

const validationResult = await validateResponse.json();

if (validationResult.success) {
  // Step 4: Login with OTP verification
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      otpVerified: true
    })
  });

  const authData = await loginResponse.json();
  // Store JWT token and redirect to dashboard
  localStorage.setItem('token', authData.token);
  window.location.href = '/dashboard';
}
```

**Example 2: Admin Checking Active OTP**

```javascript
// Admin checks if user has active OTP
const email = 'user@example.com';
const response = await fetch(`/api/otp/active/${email}`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const data = await response.json();

if (data.hasActiveOtp) {
  console.log(`Active OTP: ${data.code}`);
  console.log(`Expires at: ${data.expiresAt}`);
  console.log(`Type: ${data.tokenType}`);
} else {
  console.log('No active OTP found');
}
```

**Example 3: Rate Limit Handling**

```javascript
// Check rate limit before requesting OTP
const email = 'user@example.com';
const rateLimitResponse = await fetch(`/api/otp/rate-limit/${email}`);
const rateLimitData = await rateLimitResponse.json();

if (!rateLimitData.allowed) {
  alert(`Rate limit exceeded. ${rateLimitData.message}`);
  return;
}

// Proceed with OTP generation
const generateResponse = await fetch('/api/otp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, type: 'login' })
});

if (generateResponse.status === 429) {
  const error = await generateResponse.json();
  alert(error.error);
}
```

**Example 4: PowerShell Testing Script**

```powershell
# Generate OTP
$email = "test@example.com"
$generateBody = @{
    email = $email
    type = "login"
} | ConvertTo-Json

$otpResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/otp/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $generateBody

Write-Host "OTP Code: $($otpResponse.code)"
Write-Host "Expires At: $($otpResponse.expiresAt)"

# Validate OTP
$validateBody = @{
    email = $email
    otpCode = $otpResponse.code
    tokenType = "login"
} | ConvertTo-Json

$validateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/otp/validate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $validateBody

Write-Host "Validation Success: $($validateResponse.success)"
```

---

#### OTP Best Practices

**Security:**
- Always use HTTPS in production
- Never log OTP codes in production environments
- Implement IP-based rate limiting for additional security
- Monitor failed validation attempts for suspicious activity
- Use secure random number generation for OTP codes

**User Experience:**
- Display clear expiry time to users
- Show remaining attempts on validation errors
- Provide option to resend OTP if expired
- Implement countdown timer on frontend
- Auto-submit OTP when 6 digits entered

**Error Handling:**
- Handle all HTTP status codes appropriately
- Display user-friendly error messages
- Implement retry logic with exponential backoff
- Log errors for debugging and monitoring
- Provide fallback authentication methods

**Performance:**
- Cache rate limit checks to reduce database queries
- Use database indexes on email and expires_at columns
- Implement automated cleanup of expired tokens
- Monitor OTP generation and validation metrics
- Set appropriate database connection pool sizes

**Compliance:**
- Log all OTP operations for audit trail
- Implement data retention policies
- Ensure GDPR compliance for email storage
- Document security measures for compliance audits
- Regular security reviews and penetration testing

---

### Dashboard Endpoints

#### Get User Stats
```http
GET /api/users/:userId/stats
Authorization: Bearer {token}
```

**Parameters:**
- `userId` (number): User ID to fetch stats for

**Authorization:**
- Users can only access their own stats unless they have admin role
- Returns 403 Forbidden if unauthorized

**Response:**
```json
{
  "totalConnections": 0,
  "activePostings": 0,
  "unreadMessages": 0,
  "profileViews": 0
}
```

**Status:** ✅ Implemented (returns default values until database tables are created)

---

#### Get Recent Conversations
```http
GET /api/conversations/recent?userId={userId}&limit={limit}
Authorization: Bearer {token}
```

**Parameters:**
- `userId` (number): User ID to fetch conversations for
- `limit` (number, optional): Maximum results (default: 5)

**Authorization:**
- Users can only access their own conversations unless they have admin role
- Returns 403 Forbidden if unauthorized

**Response:**
```json
[]
```

**Status:** ✅ Implemented (returns empty array until messaging tables are created)

---

#### Get Personalized Posts
```http
GET /api/posts/personalized?userId={userId}&limit={limit}
Authorization: Bearer {token}
```

**Parameters:**
- `userId` (number): User ID to fetch personalized posts for
- `limit` (number, optional): Maximum results (default: 10)

**Authorization:**
- Users can only access their own posts unless they have admin role
- Returns 403 Forbidden if unauthorized

**Response:**
```json
[]
```

**Status:** ✅ Implemented (returns empty array until posts tables are created)

---

#### Get Notifications
```http
GET /api/notifications?userId={userId}&limit={limit}
Authorization: Bearer {token}
```

**Parameters:**
- `userId` (number): User ID to fetch notifications for
- `limit` (number, optional): Maximum results (default: 5)

**Authorization:**
- Users can only access their own notifications unless they have admin role
- Returns 403 Forbidden if unauthorized

**Response:**
```json
[]
```

**Status:** ✅ Implemented (returns empty array until notifications table is created)

**Implementation Notes:**
- All dashboard endpoints require authentication via JWT token
- All endpoints implement proper authorization checks
- Current implementations return safe default values (empty arrays or zero stats)
- TODO: Implement actual database queries when the following tables are created:
  - `connections` - for totalConnections stat
  - `postings` - for activePostings stat
  - `messages` - for unreadMessages stat and recent conversations
  - `profile_views` - for profileViews stat
  - `posts` - for personalized posts
  - `notifications` - for user notifications

---

### Messaging Endpoints

#### Get Conversations
```http
GET /api/messages/conversations
```

**Response:**
```json
[
  {
    "id": "conversation-id",
    "participants": [
      {
        "id": "user-id-1",
        "firstName": "John",
        "lastName": "Doe"
      }
    ],
    "lastMessage": {
      "id": "message-id",
      "content": "Hello, how are you?",
      "createdAt": "2025-01-01T12:00:00Z"
    },
    "unreadCount": 2,
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

#### Get Messages
```http
GET /api/messages/{conversationId}
```

#### Send Message
```http
POST /api/messages/send
Content-Type: application/json

{
  "conversationId": "conversation-id",
  "content": "Hello, how are you?",
  "messageType": "text"
}
```

---

*This document contains detailed API endpoint specifications for the SGSGitaAlumni platform.*