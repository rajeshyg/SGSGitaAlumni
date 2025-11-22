# Alumni Management Workflow Design

## **Overview**
This document defines the proper workflow for managing alumni contacts and app users, with clear separation between contact database management and user account management.

## **Core Concepts**

### **1. Alumni Members (Contact Database)**
- **Purpose**: Administrative contact database of ALL alumni
- **Managed by**: Admin only
- **Contains**: Contact info, graduation details, family info
- **Status**: Static contact records (can be updated by admin)

### **2. App Users (Application Users)**
- **Purpose**: User accounts for people who joined the app
- **Managed by**: Admin (accounts) + Users (profiles)
- **Contains**: Login credentials, app-specific data
- **Status**: Active user accounts with authentication

### **3. Invitation System**
- **Purpose**: Bridge between contact database and user accounts
- **Process**: Admin selects contacts → sends invitations → contacts become users
- **Tracking**: Full audit trail of invitation process

## **Workflow Design**

### **Phase 1: Alumni Contact Management**

#### **Admin Actions**
1. **View Alumni Database**
   - Browse all 1,279 alumni contact records
   - Search/filter by name, batch, center, etc.
   - View complete contact information

2. **Manage Contact Records**
   - Add new alumni contacts
   - Edit existing contact information
   - Update graduation details, family info
   - Mark contacts as verified/unverified

3. **Contact Status Tracking**
   - Track which contacts have been invited
   - Track which contacts have joined the app
   - Track which contacts declined invitations

#### **UI Screens**
- **Alumni Contact Directory** - Browse/search all contacts
- **Contact Editor** - Add/edit individual contact records
- **Contact Import** - Bulk import from CSV/Excel
- **Contact Reports** - Statistics and analytics

### **Phase 2: Invitation Management**

#### **Admin Actions**
1. **Select Contacts for Invitation**
   - Browse alumni contact database
   - Select individual contacts or bulk select
   - Preview invitation details

2. **Send Invitations**
   - Generate unique invitation tokens
   - Send email invitations with registration links
   - Set invitation expiry dates
   - Track invitation status

3. **Manage Invitations**
   - View pending invitations
   - Resend expired invitations
   - Cancel pending invitations
   - Track invitation analytics

#### **Invitation Process**
```
Admin selects alumni_member record
    ↓
System generates invitation with alumni_member_id reference
    ↓
Email sent with unique invitation link
    ↓
Alumni clicks link → registration form pre-filled with contact data
    ↓
Alumni completes registration → app_user created with alumni_member_id link
    ↓
User can now login and access app
```

#### **UI Screens**
- **Invitation Creator** - Select contacts and send invitations
- **Invitation Dashboard** - Track all invitation statuses
- **Invitation Analytics** - Success rates, response times

### **Phase 3: User Account Management**

#### **Admin Actions**
1. **View App Users**
   - Browse all users who joined the app
   - See linked alumni contact information
   - View user activity and status

2. **Manage User Accounts**
   - Enable/disable user accounts
   - Reset passwords
   - Update user roles and permissions
   - View user login history

3. **Link Management**
   - Link existing users to alumni contacts
   - Unlink users from alumni contacts
   - Handle users not in alumni database

#### **User Actions**
1. **Profile Management**
   - Edit personal information
   - Update contact details
   - Manage privacy settings
   - Upload profile photos

2. **Account Settings**
   - Change password
   - Update email preferences
   - Manage notification settings

#### **UI Screens**
- **User Management Dashboard** - Admin view of all app users
- **User Profile Editor** - Admin edit user accounts
- **User Profile** - User's own profile management
- **Account Settings** - User account preferences

## **Data Flow Architecture**

### **Database Relationships**
```sql
alumni_members (contact database)
    ↓ (one-to-many)
app_users (user accounts)
    ↓ (foreign key: alumni_member_id)
```

### **Profile Data Resolution**
1. **For Linked Users** (alumni_member_id exists):
   - Primary data from `alumni_members` table
   - User-specific data from `app_users` table
   - Merge both for complete profile

2. **For Unlinked Users** (alumni_member_id is null):
   - All data from `app_users` table
   - Clear indication that user is not linked to alumni database
   - Option for admin to link to existing contact or create new contact

### **API Endpoint Structure**

#### **Alumni Contact Management**
- `GET /api/admin/alumni-contacts` - Browse contact database
- `POST /api/admin/alumni-contacts` - Add new contact
- `PUT /api/admin/alumni-contacts/:id` - Update contact
- `DELETE /api/admin/alumni-contacts/:id` - Remove contact
- `GET /api/admin/alumni-contacts/search` - Search contacts

#### **Invitation Management**
- `POST /api/admin/invitations` - Send invitation to contact(s)
- `GET /api/admin/invitations` - List all invitations
- `PUT /api/admin/invitations/:id` - Update invitation status
- `DELETE /api/admin/invitations/:id` - Cancel invitation
- `GET /api/invitations/:token` - Get invitation details (public)

#### **User Account Management**
- `GET /api/admin/users` - List all app users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user account
- `POST /api/admin/users/:id/link` - Link user to alumni contact
- `DELETE /api/admin/users/:id/link` - Unlink user from contact

#### **User Profile Management**
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id/profile` - Get user profile (for admin)

## **Implementation Benefits**

### **Clear Separation**
- Alumni contacts managed separately from user accounts
- No confusion between contact database and app users
- Clear audit trail for all operations

### **Flexible User Management**
- Users can exist without being in alumni database
- Alumni contacts can exist without being app users
- Proper linking mechanism when needed

### **Better Admin Experience**
- Separate interfaces for different management tasks
- Clear workflow from contact → invitation → user
- Comprehensive tracking and analytics

### **Better User Experience**
- Profile data always available (from correct source)
- No "Unknown" names or missing information
- Clear indication of data source and completeness

## **Migration Strategy**

### **Phase 1: Fix Current User**
1. Link user 4600 to appropriate alumni_members record
2. Update profile APIs to handle both linked and unlinked users
3. Fix Edit Profile screen to show correct data

### **Phase 2: Implement New Workflow**
1. Create separate admin interfaces for contacts vs users
2. Implement proper invitation workflow
3. Update all APIs to follow new architecture

### **Phase 3: Data Cleanup**
1. Review all existing app_users for proper linking
2. Clean up any orphaned or duplicate records
3. Implement validation rules for data integrity
