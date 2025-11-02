# Task 8.11: Family Member System with Shared Email & Individual Preferences

**Status:** 🟡 Planned
**Priority:** Critical
**Duration:** 4 weeks
**Dependencies:** Task 8.1 (Age Verification), Task 7.7 (Preferences System), Task 7.3 (Authentication)
**Owner:** Backend + Frontend Team
**Created:** 2025-10-29

## Overview
Implement comprehensive family member system supporting multiple family members sharing a single parent email account, with age-based access control (14+ with parent consent), Netflix-style profile switching, and individual preferences per family member.

## Business Requirements

### Core Concept
**One Parent Account → Multiple Family Member Profiles**

```
Parent Email: parent@email.com (Primary Account Holder)
  ├── 👤 Child 1 Profile (Age 16, Full Access)
  ├── 👤 Child 2 Profile (Age 14, Parent Consent Required)
  ├── 👤 Child 3 Profile (Age 12, BLOCKED - Under 14)
  └── 👤 Parent Profile (Full Access)
```

### Key Requirements
- **Shared Email:** Multiple family members use same parent email
- **Individual Profiles:** Each member has own profile, preferences, and activity
- **Age Restrictions:** 
  - Under 14: Blocked entirely ❌
  - 14-17: Access with parent consent ✅ (Supervised)
  - 18+: Full access ✅
- **Netflix-Style Switching:** "Who's using Gita Connect?" profile selector
- **Individual Preferences:** Each member has own domains, notifications, privacy settings
- **Parent Dashboard:** Manage all family members, consent, and activity monitoring

## Current State Analysis

### ✅ Already Implemented
- `FAMILY_INVITATIONS` table
- `AGE_VERIFICATION` table
- `PARENT_CONSENT_RECORDS` table
- `USER_PREFERENCES` table (per user)
- Age verification logic (in Task 7.3)
- COPPA compliance framework
- Preferences system (Task 7.7)

### ❌ Missing Components
- **No `FAMILY_MEMBERS` table** - Only mentioned in diagrams, not created
- **No shared email support** - Current design assumes 1 email = 1 user
- **No family account linking** - Can't link multiple profiles to one parent email
- **No profile switching** - No "Netflix-style" profile selection
- **No per-member preferences** - Preferences tied to user_id, not family member
- **No parent dashboard** - No way for parent to manage multiple children

## Database Schema Design

### 1. Create FAMILY_MEMBERS Table

```sql
-- ============================================================================
-- FAMILY MEMBERS TABLE
-- ============================================================================
-- Stores individual profiles for each family member under a parent account
-- Supports Netflix-style profile switching and individual preferences
-- ============================================================================
CREATE TABLE FAMILY_MEMBERS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Link to parent account
    parent_user_id BIGINT NOT NULL COMMENT 'The app_users.id of parent account holder',
    
    -- Link to alumni data (if applicable)
    alumni_member_id INT NULL COMMENT 'Links to alumni_members table if this member is an alumnus',
    
    -- Family member personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    
    -- Age verification and access control
    birth_date DATE NULL COMMENT 'For age calculation',
    age_at_registration INT NULL,
    current_age INT NULL COMMENT 'Auto-calculated field, updated periodically',
    
    -- Access permissions
    can_access_platform BOOLEAN DEFAULT FALSE COMMENT '14+ only',
    requires_parent_consent BOOLEAN DEFAULT FALSE COMMENT 'Ages 14-17',
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    
    -- Relationship to parent
    relationship ENUM('self', 'child', 'spouse', 'sibling', 'guardian') DEFAULT 'child',
    is_primary_contact BOOLEAN DEFAULT FALSE COMMENT 'True for parent''s own profile',
    
    -- Profile metadata
    profile_image_url VARCHAR(500),
    bio TEXT,
    status ENUM('active', 'inactive', 'suspended', 'pending_consent') DEFAULT 'pending_consent',
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    last_consent_check_at TIMESTAMP NULL COMMENT 'For annual renewal',
    
    -- Foreign key constraints
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_can_access (can_access_platform),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual profiles for family members sharing a parent account';
```

### 2. Modify USER_PREFERENCES Table

**Problem:** Current design ties preferences to `user_id` (one set per account)  
**Solution:** Link preferences to `family_member_id` for individual member preferences

```sql
-- ============================================================================
-- MODIFY USER_PREFERENCES FOR FAMILY MEMBER SUPPORT
-- ============================================================================
ALTER TABLE USER_PREFERENCES
-- Add family member link
ADD COLUMN family_member_id CHAR(36) NULL AFTER user_id 
    COMMENT 'Links to FAMILY_MEMBERS for individual member preferences',

-- Add foreign key
ADD CONSTRAINT fk_family_member_preferences 
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,

-- Add index
ADD INDEX idx_family_member_preferences (family_member_id),

-- Unique constraint: one preference set per family member
ADD CONSTRAINT uk_family_member_preferences 
    UNIQUE (family_member_id);

-- Note: Keep user_id for backward compatibility
-- Either user_id OR family_member_id should be set, but not both for new records
```

**Migration Strategy for Existing Users:**

```sql
-- Step 1: Create default family member for existing users (self profile)
INSERT INTO FAMILY_MEMBERS (
    parent_user_id,
    first_name,
    last_name,
    birth_date,
    relationship,
    is_primary_contact,
    can_access_platform,
    access_level,
    status
)
SELECT 
    id as parent_user_id,
    first_name,
    last_name,
    birth_date,
    'self' as relationship,
    TRUE as is_primary_contact,
    TRUE as can_access_platform,
    'full' as access_level,
    'active' as status
FROM app_users
WHERE NOT EXISTS (
    SELECT 1 FROM FAMILY_MEMBERS WHERE parent_user_id = app_users.id
);

-- Step 2: Update existing preferences to link to family member
UPDATE USER_PREFERENCES up
JOIN FAMILY_MEMBERS fm ON fm.parent_user_id = up.user_id AND fm.is_primary_contact = TRUE
SET up.family_member_id = fm.id
WHERE up.family_member_id IS NULL;
```

### 3. Create FAMILY_ACCESS_LOG Table

```sql
-- ============================================================================
-- FAMILY ACCESS LOG TABLE
-- ============================================================================
-- Tracks when family members access the platform
-- Useful for parent monitoring and security auditing
-- ============================================================================
CREATE TABLE FAMILY_ACCESS_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    family_member_id CHAR(36) NOT NULL,
    parent_user_id BIGINT NOT NULL,
    access_type ENUM('login', 'profile_switch', 'logout') NOT NULL,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    session_id VARCHAR(255),
    
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    
    INDEX idx_family_member (family_member_id),
    INDEX idx_parent_user (parent_user_id),
    INDEX idx_access_timestamp (access_timestamp),
    INDEX idx_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log of family member platform access';
```

### 4. Modify app_users Table

```sql
-- ============================================================================
-- MODIFY APP_USERS FOR FAMILY ACCOUNT SUPPORT
-- ============================================================================
ALTER TABLE app_users
ADD COLUMN is_family_account BOOLEAN DEFAULT FALSE AFTER email
    COMMENT 'Indicates if this account manages multiple family members',
    
ADD COLUMN family_account_type ENUM('individual', 'parent', 'shared') DEFAULT 'individual' 
    AFTER is_family_account
    COMMENT 'Type of family account',
    
ADD COLUMN primary_family_member_id CHAR(36) NULL AFTER family_account_type
    COMMENT 'Currently active family member profile',

ADD INDEX idx_family_account (is_family_account),
ADD INDEX idx_family_type (family_account_type);

-- Add foreign key constraint (after FAMILY_MEMBERS table is created)
ALTER TABLE app_users
ADD CONSTRAINT fk_primary_family_member 
    FOREIGN KEY (primary_family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE SET NULL;
```

## Backend Implementation

### 1. FamilyMemberService

```typescript
/**
 * Service for managing family member profiles and access control
 */
interface FamilyMemberService {
  // CRUD Operations
  getFamilyMembers(parentUserId: string): Promise<FamilyMember[]>;
  getFamilyMember(familyMemberId: string): Promise<FamilyMember>;
  createFamilyMember(parentUserId: string, memberData: CreateFamilyMemberData): Promise<FamilyMember>;
  updateFamilyMember(familyMemberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(familyMemberId: string): Promise<void>;
  
  // Access Control
  calculateAccess(birthDate: Date): AccessResult;
  validateAccess(familyMemberId: string): Promise<boolean>;
  updateAccessLevel(familyMemberId: string, level: AccessLevel): Promise<void>;
  
  // Profile Switching
  switchProfile(parentUserId: string, familyMemberId: string): Promise<SwitchResult>;
  getActiveProfile(parentUserId: string): Promise<FamilyMember>;
  
  // Consent Management
  grantConsent(familyMemberId: string, consentData: ConsentData): Promise<ConsentRecord>;
  revokeConsent(familyMemberId: string): Promise<void>;
  checkConsentExpiry(familyMemberId: string): Promise<ConsentStatus>;
  
  // Linking to Alumni Data
  linkToAlumniMember(familyMemberId: string, alumniMemberId: string): Promise<void>;
  unlinkFromAlumniMember(familyMemberId: string): Promise<void>;
}

interface FamilyMember {
  id: string;
  parentUserId: string;
  alumniMemberId?: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  birthDate?: Date;
  currentAge?: number;
  canAccessPlatform: boolean;
  requiresParentConsent: boolean;
  parentConsentGiven: boolean;
  parentConsentDate?: Date;
  accessLevel: 'full' | 'supervised' | 'blocked';
  relationship: 'self' | 'child' | 'spouse' | 'sibling' | 'guardian';
  isPrimaryContact: boolean;
  profileImageUrl?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_consent';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastConsentCheckAt?: Date;
}

interface CreateFamilyMemberData {
  firstName: string;
  lastName: string;
  birthDate?: Date;
  alumniMemberId?: string;
  relationship: 'child' | 'spouse' | 'sibling';
}

interface AccessResult {
  age: number;
  canAccessPlatform: boolean;
  requiresParentConsent: boolean;
  accessLevel: 'full' | 'supervised' | 'blocked';
  reason: string;
}

interface SwitchResult {
  success: boolean;
  activeFamilyMember: FamilyMember;
  preferences: UserPreferences;
}

interface ConsentData {
  parentName: string;
  parentEmail: string;
  digitalSignature: string;
  ipAddress: string;
}

interface ConsentRecord {
  id: string;
  familyMemberId: string;
  consentGiven: boolean;
  consentDate: Date;
  expiresAt: Date;
}

interface ConsentStatus {
  hasConsent: boolean;
  expiresAt?: Date;
  daysUntilExpiry?: number;
  needsRenewal: boolean;
}
```

### 2. FamilyPreferencesService

```typescript
/**
 * Service for managing individual preferences per family member
 */
interface FamilyPreferencesService {
  getPreferences(familyMemberId: string): Promise<UserPreferences>;
  updatePreferences(familyMemberId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  resetPreferences(familyMemberId: string): Promise<UserPreferences>;
  copyPreferences(fromMemberId: string, toMemberId: string): Promise<UserPreferences>;
}
```

### 3. Access Control Logic

```typescript
/**
 * Age-based access control rules (COPPA compliant)
 */
const AccessControlRules = {
  calculate: (birthDate: Date): AccessResult => {
    const age = calculateAge(birthDate);
    
    // Under 14: Blocked entirely
    if (age < 14) {
      return {
        age,
        canAccessPlatform: false,
        requiresParentConsent: false,
        accessLevel: 'blocked',
        reason: 'Must be 14 or older to access platform (COPPA compliance)'
      };
    }
    
    // Ages 14-17: Requires parent consent
    if (age >= 14 && age < 18) {
      return {
        age,
        canAccessPlatform: true, // If parent consent given
        requiresParentConsent: true,
        accessLevel: 'supervised',
        reason: 'Requires annual parent consent (ages 14-17)'
      };
    }
    
    // 18+: Full access
    return {
      age,
      canAccessPlatform: true,
      requiresParentConsent: false,
      accessLevel: 'full',
      reason: 'Full access (18+)'
    };
  },
  
  validateConsent: async (familyMemberId: string): Promise<boolean> => {
    const member = await getFamilyMember(familyMemberId);
    
    // If doesn't require consent, automatically valid
    if (!member.requiresParentConsent) return true;
    
    // Check if consent given and not expired
    if (!member.parentConsentGiven) return false;
    
    const consentStatus = await checkConsentExpiry(familyMemberId);
    return !consentStatus.needsRenewal;
  }
};

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
```

## API Endpoints

### Family Member Management

```typescript
// Get all family members for parent account
GET /api/family-members
Response: {
  familyMembers: FamilyMember[];
  parentAccount: User;
}

// Get specific family member
GET /api/family-members/:id
Response: { familyMember: FamilyMember }

// Create new family member
POST /api/family-members
Body: {
  firstName: string;
  lastName: string;
  birthDate?: Date;
  alumniMemberId?: string;
  relationship: 'child' | 'spouse' | 'sibling';
}
Response: { familyMember: FamilyMember }

// Update family member
PUT /api/family-members/:id
Body: Partial<FamilyMember>
Response: { familyMember: FamilyMember }

// Delete family member
DELETE /api/family-members/:id
Response: { success: boolean }

// Switch active profile
POST /api/family-members/:id/switch
Response: { 
  success: boolean;
  activeFamilyMember: FamilyMember;
  preferences: UserPreferences;
}

// Link to alumni member
POST /api/family-members/:id/link-alumni
Body: { alumniMemberId: string }
Response: { success: boolean }
```

### Preferences Management

```typescript
// Get family member preferences
GET /api/family-members/:id/preferences
Response: { preferences: UserPreferences }

// Update family member preferences
PUT /api/family-members/:id/preferences
Body: Partial<UserPreferences>
Response: { preferences: UserPreferences }

// Reset to defaults
POST /api/family-members/:id/preferences/reset
Response: { preferences: UserPreferences }
```

### Consent Management

```typescript
// Get consent status
GET /api/family-members/:id/consent-status
Response: {
  requiresConsent: boolean;
  consentGiven: boolean;
  consentDate?: Date;
  expiresAt?: Date;
  needsRenewal: boolean;
}

// Grant consent
POST /api/family-members/:id/grant-consent
Body: {
  parentName: string;
  parentEmail: string;
  digitalSignature: string;
}
Response: { consentRecord: ConsentRecord }

// Revoke consent
DELETE /api/family-members/:id/consent
Response: { success: boolean }
```

### Age Verification

```typescript
// Verify age and calculate access
POST /api/family-members/:id/verify-age
Body: { birthDate: Date }
Response: {
  age: number;
  canAccessPlatform: boolean;
  requiresParentConsent: boolean;
  accessLevel: 'full' | 'supervised' | 'blocked';
  reason: string;
}
```

## Frontend Implementation

### 1. Family Profile Selector (Netflix-Style)

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings } from 'lucide-react';

interface FamilyProfileSelectorProps {
  onProfileSelect: (memberId: string) => void;
}

export const FamilyProfileSelector: React.FC<FamilyProfileSelectorProps> = ({
  onProfileSelect
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family-members');
      const data = await response.json();
      setFamilyMembers(data.familyMembers.filter(m => m.canAccessPlatform));
    } catch (error) {
      console.error('Failed to load family members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Who's using Gita Connect?
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {familyMembers.map((member) => (
            <ProfileCard
              key={member.id}
              member={member}
              onClick={() => onProfileSelect(member.id)}
            />
          ))}
          
          <AddProfileCard onClick={() => {/* Navigate to add member */}} />
        </div>
        
        <div className="text-center">
          <button className="text-gray-600 hover:text-gray-800 flex items-center gap-2 mx-auto">
            <Settings className="w-5 h-5" />
            Manage Family Profiles
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileCard: React.FC<{ member: FamilyMember; onClick: () => void }> = ({
  member,
  onClick
}) => {
  return (
    <Card 
      className="cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-xl"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={member.profileImageUrl} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white">
            {member.firstName[0]}{member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-lg mb-2">{member.displayName || member.firstName}</h3>
        
        {member.requiresParentConsent && (
          <Badge variant="secondary" className="text-xs">
            Supervised
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

const AddProfileCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:scale-105 transition-transform duration-200 border-dashed border-2"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Plus className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">Add Family Member</p>
      </CardContent>
    </Card>
  );
};
```

### 2. Parent Dashboard

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserPlus, Shield, Activity } from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Family Account Management</h1>
        <Button onClick={handleAddMember}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Family Member
        </Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">Family Members</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <FamilyMembersList 
            members={familyMembers}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManagementPanel members={familyMembers} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 3. Age Verification & Consent Flow

```typescript
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

export const AgeVerificationFlow: React.FC<{
  familyMember: Partial<FamilyMember>;
  onComplete: (member: FamilyMember) => void;
}> = ({ familyMember, onComplete }) => {
  const [step, setStep] = useState<'age' | 'consent' | 'complete'>('age');
  const [birthDate, setBirthDate] = useState<Date>();
  const [accessResult, setAccessResult] = useState<AccessResult>();

  const handleAgeVerification = async () => {
    const result = await verifyAge(birthDate!);
    setAccessResult(result);
    
    if (result.requiresParentConsent) {
      setStep('consent');
    } else if (result.canAccessPlatform) {
      setStep('complete');
    } else {
      // Under 14, show error
      alert('Must be 14 or older to access the platform');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {step === 'age' && (
        <AgeEntryStep
          onDateSelect={setBirthDate}
          onContinue={handleAgeVerification}
        />
      )}
      
      {step === 'consent' && accessResult && (
        <ParentConsentStep
          familyMember={familyMember}
          accessResult={accessResult}
          onConsentGiven={() => setStep('complete')}
        />
      )}
      
      {step === 'complete' && (
        <VerificationCompleteStep
          familyMember={familyMember}
          onContinue={onComplete}
        />
      )}
    </div>
  );
};
```

## Implementation Timeline

### Week 1: Database Foundation
- [ ] Create `FAMILY_MEMBERS` table
- [ ] Modify `USER_PREFERENCES` table
- [ ] Create `FAMILY_ACCESS_LOG` table
- [ ] Modify `app_users` table
- [ ] Write and test migration scripts
- [ ] Migrate existing users to family member model

### Week 2: Backend Services
- [ ] Implement `FamilyMemberService`
- [ ] Implement `FamilyPreferencesService`
- [ ] Implement access control logic
- [ ] Create all API endpoints
- [ ] Add authentication middleware for family context
- [ ] Write unit and integration tests

### Week 3: Frontend Components
- [ ] Build Family Profile Selector (Netflix-style)
- [ ] Build Parent Dashboard
- [ ] Build Add/Edit Family Member forms
- [ ] Build Age Verification & Consent UI
- [ ] Build Profile Switching mechanism
- [ ] Integrate with existing auth system

### Week 4: Integration & Testing
- [ ] End-to-end testing of family workflows
- [ ] Test multi-family scenarios
- [ ] Test age verification edge cases
- [ ] Test preferences isolation
- [ ] Mobile/tablet/desktop testing
- [ ] Performance testing
- [ ] Security audit

## Success Criteria

### Technical Success
- [ ] **Shared Email Support:** Multiple family members use same email
- [ ] **Profile Switching:** Seamless Netflix-style profile switching
- [ ] **Individual Preferences:** Complete isolation per family member
- [ ] **Access Control:** Age-based restrictions enforced correctly
- [ ] **Parent Dashboard:** Full family management capabilities

### Legal Compliance
- [ ] **COPPA Compliance:** Under 14 blocked, 14-17 require consent
- [ ] **Consent Tracking:** Complete audit trail of all consents
- [ ] **Annual Renewal:** Automatic consent expiry and renewal prompts
- [ ] **Data Protection:** Secure handling of minor data

### User Experience
- [ ] **Intuitive UI:** Easy profile selection and switching
- [ ] **Mobile Optimized:** Full functionality on mobile devices
- [ ] **Clear Messaging:** Transparent about age restrictions and consent
- [ ] **Performance:** Fast profile switching (<500ms)

### Business Objectives
- [ ] **Family Adoption:** 70%+ of families use multiple profiles
- [ ] **Consent Rate:** 90%+ consent completion for 14-17 year olds
- [ ] **User Satisfaction:** 4.5+ star rating for family features
- [ ] **Platform Engagement:** Increased activity from family accounts

## Risk Mitigation

### Data Integrity Risks
- **Mitigation:** Comprehensive database constraints and validation
- **Mitigation:** Regular data integrity checks and automated fixes
- **Mitigation:** Thorough migration testing before production deployment

### Access Control Risks
- **Mitigation:** Multi-layer validation (frontend + backend + database)
- **Mitigation:** Regular consent expiry checks and notifications
- **Mitigation:** Audit logging of all access control decisions

### User Experience Risks
- **Mitigation:** User testing with actual families
- **Mitigation:** Clear documentation and help resources
- **Mitigation:** Progressive disclosure to reduce complexity

### Performance Risks
- **Mitigation:** Database query optimization and indexing
- **Mitigation:** Caching of frequently accessed family data
- **Mitigation:** Load testing with realistic family scenarios

## Related Tasks

- **Task 8.1:** Age Verification & COPPA Compliance (Foundation)
- **Task 7.7:** Domain Taxonomy & Preferences System (Individual preferences)
- **Task 7.3:** Invitation-Based Authentication (Auth integration)
- **Task 8.7:** Enhanced Onboarding Experience (Family onboarding flows)

## Next Steps

1. **Database Schema Creation** - Create all new tables and modify existing ones
2. **Data Migration** - Migrate existing users to family member model
3. **Service Development** - Build core family member services
4. **API Implementation** - Expose family management endpoints
5. **UI Development** - Build all frontend components
6. **Testing & Validation** - Comprehensive testing across all scenarios
7. **Documentation** - Update user documentation and help resources
8. **Deployment** - Phased rollout with monitoring

---

*This task enables the complete family member system with shared email support, age-based access control, and individual preferences per family member, providing a Netflix-style user experience for the Gita Connect platform.*
