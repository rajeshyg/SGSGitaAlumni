# API Endpoints Documentation

**Status:** ✅ ALIGNED WITH CURRENT IMPLEMENTATION
**Date:** September 30, 2025
**Version:** 1.0.0

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