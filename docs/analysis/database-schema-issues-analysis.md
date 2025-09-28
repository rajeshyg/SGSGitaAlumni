# Database Schema Issues Analysis

## **Root Cause: Alumni Members vs App Users Confusion**

### **Current Problematic State**

#### **Database Tables**
1. **`alumni_members`** (1,279 records) - Contact database of ALL alumni
   - Contains: family_name, father_name, student_id, batch, center_name, result, category
   - Purpose: Administrative contact database for all alumni
   - Status: Complete alumni contact records

2. **`app_users`** (minimal records) - Invited users who joined the app
   - Contains: id, email, password_hash, role, alumni_member_id (FK)
   - Purpose: User accounts for app access
   - Status: Only invited users who accepted invitations

#### **The Fundamental Problem**
- **User 4600** (`datta.rajesh@gmail.com`) is an `app_user` with `alumni_member_id: null`
- **API queries** expect `app_users` to be linked to `alumni_members` via `alumni_member_id`
- **When no link exists**, all profile data returns `null` → UI shows "Unknown"
- **Design confusion**: Mixing contact management with user management

### **Affected API Endpoints**

#### **User Profile APIs (Broken)**
1. **`GET /api/users/:id/profile`** - Returns null data when no alumni_member_id link
2. **`GET /api/users/profile`** - Current user profile (broken for unlinked users)
3. **`PUT /api/users/:id`** - Update user (tries to update both tables)
4. **`GET /api/users/search`** - User search (depends on alumni_members JOIN)

#### **Admin Management APIs (Confused)**
1. **User Management** - Manages `app_users` but displays `alumni_members` data
2. **Contact Management** - No clear separation from user management
3. **Invitation APIs** - Creates `app_users` but doesn't properly link to `alumni_members`

### **Affected UI Screens**

#### **User-Facing Screens (Broken)**
1. **Edit Profile** - Shows "Unknown" for firstName/lastName
2. **User Dashboard** - Profile information missing
3. **Profile Display** - All profile fields show as null/empty

#### **Admin Screens (Confused)**
1. **User Management** - Mixes user accounts with contact database
2. **Invitation Management** - No clear workflow for linking contacts to users
3. **Alumni Directory** - Unclear if showing contacts or app users

### **Design Flaws**

#### **1. Conceptual Confusion**
- **Alumni Members** = Contact database (should be managed by admin)
- **App Users** = Invited users who joined (should be separate from contacts)
- **Current system** tries to make every app user an alumni member

#### **2. Workflow Problems**
- No clear process for admin to manage alumni contacts separately
- No clear process for linking invited users to existing alumni records
- No fallback for users who aren't in the alumni contact database

#### **3. Data Integrity Issues**
- `app_users` can exist without `alumni_member_id` (orphaned users)
- `alumni_members` can exist without being linked to any user
- No validation ensuring proper relationships

### **Impact Assessment**

#### **Critical Issues**
- ✅ **User profiles broken** - "Unknown" names in Edit Profile
- ✅ **Admin user management confused** - Can't distinguish contacts from users
- ✅ **Invitation workflow broken** - No proper linking mechanism

#### **Functional Issues**
- User search returns incomplete data
- Profile updates may fail or update wrong records
- Admin can't manage alumni contacts separately from app users

#### **User Experience Issues**
- Users see "Unknown" instead of their names
- Admin interface is confusing and non-intuitive
- No clear separation between contact management and user management

### **Required Solution Architecture**

#### **1. Clear Separation**
- **Alumni Contact Management** - Admin manages `alumni_members` database
- **User Account Management** - Admin manages `app_users` who joined the app
- **Invitation Workflow** - Clear process linking contacts to users

#### **2. Proper Data Flow**
```
Admin manages alumni_members (contacts)
    ↓
Admin sends invitation to selected alumni
    ↓
Alumni accepts invitation → becomes app_user
    ↓
app_user.alumni_member_id links to original contact record
    ↓
User profile shows data from linked alumni_members record
```

#### **3. Fallback Mechanisms**
- Users not linked to alumni records can still have profiles
- Profile data comes from app_users table when no alumni link exists
- Clear indication when user is/isn't linked to alumni database

### **Next Steps**
1. Design proper alumni management workflow
2. Refactor database schema for clear separation
3. Update APIs to handle both linked and unlinked users
4. Refactor admin UI for separate contact/user management
5. Fix user profile screens to work with proper data flow
