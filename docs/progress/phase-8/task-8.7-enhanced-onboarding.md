# Task 8.7: Enhanced Onboarding Experience

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 1 week
**Dependencies:** Task 8.2 (Invitation System), Task 8.1 (Age Verification), Task 8.11 (Family Member System)

## Overview
Implement comprehensive onboarding experience with family access management, guided registration workflows, consent collection, and profile setup based on meeting requirements and user notes.

**Note:** This task focuses on the onboarding **flow and user experience**. The underlying family member system (shared email, profiles, preferences) is implemented in [Task 8.11: Family Member System](./task-8.11-family-member-system.md).

## Requirements Analysis

### Business Requirements from Meeting & Notes
- **Invitation-Based Access:** Users navigate via invitation link to portal
- **Terms Acceptance:** Accept terms, parent consent, and join requirements
- **OTP Authentication:** Email OTP for secure access without daily login
- **Family Profile Selection:** Parents choose profile when multiple children graduated
- **Shared Login:** 14+ kids use parent's account with their own profile (like Netflix)
  - **Implementation:** See [Task 8.11: Family Member System](./task-8.11-family-member-system.md)

### User Experience Requirements
- **Guided Workflow:** Step-by-step onboarding process
- **Mobile-First:** Optimized for mobile device completion
- **Clear Communication:** Transparent about requirements and benefits
- **Progress Tracking:** Visual progress indicators throughout process

## Database Schema Enhancements

### Modified USER_PROFILES Table
```sql
ALTER TABLE USER_PROFILES ADD COLUMN:
- enum onboarding_status "not_started,in_progress,consent_pending,profile_setup,completed",
- json onboarding_progress, -- Track completed steps
- timestamp onboarding_started_at,
- timestamp onboarding_completed_at,
- uuid onboarding_invitation_id FK,
- boolean profile_setup_completed DEFAULT FALSE,
- json profile_completion_checklist
```

### New ONBOARDING_SESSIONS Table
```sql
CREATE TABLE ONBOARDING_SESSIONS (
    uuid id PK,
    uuid invitation_id FK,
    string session_token UK,
    enum session_type "individual,family_parent,family_child",
    json session_data, -- Current step, form data, etc.
    enum current_step "invitation_validation,age_verification,consent_collection,profile_selection,profile_setup,completion",
    timestamp started_at,
    timestamp last_activity_at,
    timestamp expires_at,
    boolean is_completed DEFAULT FALSE,
    timestamp completed_at
);
```

### New FAMILY_ONBOARDING_SESSIONS Table
```sql
CREATE TABLE FAMILY_ONBOARDING_SESSIONS (
    uuid id PK,
    string parent_email,
    uuid family_invitation_id FK,
    json available_profiles, -- Children profiles available for claiming
    json claimed_profiles, -- Profiles that have been claimed
    json onboarding_progress, -- Progress for each child
    enum session_status "active,partially_completed,completed,expired",
    timestamp started_at,
    timestamp completed_at
);
```

### New ONBOARDING_ANALYTICS Table
```sql
CREATE TABLE ONBOARDING_ANALYTICS (
    uuid id PK,
    uuid session_id FK,
    enum step_name "invitation_validation,age_verification,consent_collection,profile_selection,profile_setup,completion",
    timestamp step_started_at,
    timestamp step_completed_at,
    integer time_spent_seconds,
    json step_data, -- Form data, errors, etc.
    enum completion_status "completed,abandoned,error",
    string error_message,
    string user_agent,
    string device_type
);
```

## Implementation Components

### 1. Onboarding Orchestration Service
```typescript
interface OnboardingOrchestrationService {
  startOnboardingSession(invitationToken: string): Promise<OnboardingSession>;
  getCurrentStep(sessionId: string): Promise<OnboardingStep>;
  completeStep(sessionId: string, stepData: any): Promise<StepResult>;
  getProgress(sessionId: string): Promise<OnboardingProgress>;
  resumeSession(sessionToken: string): Promise<OnboardingSession>;
  abandonSession(sessionId: string, reason?: string): Promise<void>;
}

interface OnboardingSession {
  id: string;
  sessionToken: string;
  type: 'individual' | 'family_parent' | 'family_child';
  currentStep: OnboardingStepType;
  progress: OnboardingProgress;
  expiresAt: Date;
  sessionData: any;
}

interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentComplete: number;
  estimatedTimeRemaining: number;
  stepStatuses: StepStatus[];
}

interface StepResult {
  success: boolean;
  nextStep?: OnboardingStepType;
  errors?: string[];
  data?: any;
}

type OnboardingStepType = 
  | 'invitation_validation'
  | 'age_verification'
  | 'consent_collection'
  | 'profile_selection'
  | 'profile_setup'
  | 'completion';
```

### 2. Family Onboarding Service
```typescript
interface FamilyOnboardingService {
  startFamilyOnboarding(familyInvitationToken: string): Promise<FamilyOnboardingSession>;
  getAvailableProfiles(sessionId: string): Promise<ChildProfile[]>;
  claimChildProfile(sessionId: string, profileId: string, parentData: ParentData): Promise<ClaimResult>;
  setupChildAccount(claimId: string, childData: ChildAccountData): Promise<User>;
  completeFamilyOnboarding(sessionId: string): Promise<FamilyOnboardingResult>;
}

interface FamilyOnboardingSession {
  id: string;
  parentEmail: string;
  availableProfiles: ChildProfile[];
  claimedProfiles: ClaimedProfile[];
  progress: FamilyProgress;
}

interface ChildProfile {
  id: string;
  name: string;
  graduationYear: number;
  program: string;
  isAvailable: boolean;
  estimatedAge: number;
}

interface ClaimedProfile {
  profileId: string;
  childName: string;
  parentData: ParentData;
  onboardingStatus: OnboardingStepType;
  accountCreated: boolean;
}

interface ParentData {
  name: string;
  email: string;
  relationship: 'parent' | 'guardian';
  phoneNumber?: string;
  consentGiven: boolean;
  consentDate: Date;
}
```

### 3. Profile Setup Service
```typescript
interface ProfileSetupService {
  getProfileSetupChecklist(userId: string): Promise<ProfileChecklist>;
  updateProfileSection(userId: string, section: string, data: any): Promise<UpdateResult>;
  validateProfileCompleteness(userId: string): Promise<CompletenessResult>;
  generateProfileSuggestions(userId: string): Promise<ProfileSuggestion[]>;
  completeProfileSetup(userId: string): Promise<void>;
}

interface ProfileChecklist {
  sections: ProfileSection[];
  overallCompletion: number;
  requiredSections: string[];
  optionalSections: string[];
}

interface ProfileSection {
  name: string;
  displayName: string;
  isRequired: boolean;
  isCompleted: boolean;
  completionPercentage: number;
  fields: ProfileField[];
}

interface ProfileField {
  name: string;
  displayName: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'file';
  isRequired: boolean;
  isCompleted: boolean;
  value?: any;
  options?: string[];
  validation?: ValidationRule[];
}
```

## User Interface Components

### 1. Onboarding Wizard Component
```typescript
interface OnboardingWizardProps {
  sessionToken: string;
  onComplete: (result: OnboardingResult) => void;
  onAbandon: (reason?: string) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  sessionToken,
  onComplete,
  onAbandon
}) => {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>('invitation_validation');
  
  return (
    <div className="onboarding-wizard">
      <OnboardingHeader progress={session?.progress} />
      <OnboardingStepRenderer 
        step={currentStep}
        sessionData={session?.sessionData}
        onStepComplete={handleStepComplete}
      />
      <OnboardingNavigation 
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
      />
    </div>
  );
};
```

### 2. Family Profile Selection Component
```typescript
interface FamilyProfileSelectionProps {
  availableProfiles: ChildProfile[];
  onProfileSelect: (profileId: string) => void;
  onComplete: () => void;
}

const FamilyProfileSelection: React.FC<FamilyProfileSelectionProps> = ({
  availableProfiles,
  onProfileSelect,
  onComplete
}) => {
  return (
    <div className="family-profile-selection">
      <h2>Select Your Children's Profiles</h2>
      <p>Choose which of your children you'd like to create accounts for:</p>
      
      <div className="profile-grid">
        {availableProfiles.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onSelect={() => onProfileSelect(profile.id)}
          />
        ))}
      </div>
      
      <div className="selection-summary">
        <SelectedProfilesList />
        <Button onClick={onComplete}>Continue with Selected Profiles</Button>
      </div>
    </div>
  );
};
```

### 3. Progressive Profile Setup Component
```typescript
interface ProgressiveProfileSetupProps {
  userId: string;
  checklist: ProfileChecklist;
  onSectionComplete: (section: string) => void;
  onComplete: () => void;
}

const ProgressiveProfileSetup: React.FC<ProgressiveProfileSetupProps> = ({
  userId,
  checklist,
  onSectionComplete,
  onComplete
}) => {
  return (
    <div className="progressive-profile-setup">
      <ProfileCompletionProgress checklist={checklist} />
      
      <div className="setup-sections">
        {checklist.sections.map(section => (
          <ProfileSectionCard
            key={section.name}
            section={section}
            onComplete={() => onSectionComplete(section.name)}
          />
        ))}
      </div>
      
      <ProfilePreview userId={userId} />
      <Button 
        onClick={onComplete}
        disabled={checklist.overallCompletion < 80}
      >
        Complete Profile Setup
      </Button>
    </div>
  );
};
```

## Onboarding Flow Implementation

### 1. Individual User Flow
```typescript
const INDIVIDUAL_ONBOARDING_STEPS = [
  {
    name: 'invitation_validation',
    component: InvitationValidationStep,
    title: 'Welcome to Gita Connect',
    description: 'Validating your invitation...',
    estimatedTime: 1
  },
  {
    name: 'age_verification',
    component: AgeVerificationStep,
    title: 'Age Verification',
    description: 'Please confirm your date of birth',
    estimatedTime: 2
  },
  {
    name: 'consent_collection',
    component: ConsentCollectionStep,
    title: 'Terms and Consent',
    description: 'Review and accept our terms of service',
    estimatedTime: 3
  },
  {
    name: 'profile_setup',
    component: ProfileSetupStep,
    title: 'Create Your Profile',
    description: 'Set up your alumni profile',
    estimatedTime: 10
  },
  {
    name: 'completion',
    component: OnboardingCompletionStep,
    title: 'Welcome to the Community!',
    description: 'Your account is ready',
    estimatedTime: 1
  }
];
```

### 2. Family Onboarding Flow
```typescript
const FAMILY_ONBOARDING_STEPS = [
  {
    name: 'invitation_validation',
    component: FamilyInvitationValidationStep,
    title: 'Family Invitation',
    description: 'Validating your family invitation...',
    estimatedTime: 1
  },
  {
    name: 'profile_selection',
    component: FamilyProfileSelectionStep,
    title: 'Select Children Profiles',
    description: 'Choose which children to create accounts for',
    estimatedTime: 5
  },
  {
    name: 'consent_collection',
    component: FamilyConsentCollectionStep,
    title: 'Parent Consent',
    description: 'Provide consent for your children',
    estimatedTime: 5
  },
  {
    name: 'child_account_setup',
    component: ChildAccountSetupStep,
    title: 'Set Up Child Accounts',
    description: 'Create profiles for your children',
    estimatedTime: 15
  },
  {
    name: 'completion',
    component: FamilyOnboardingCompletionStep,
    title: 'Family Setup Complete!',
    description: 'All accounts are ready',
    estimatedTime: 1
  }
];
```

## Mobile Optimization

### 1. Touch-Friendly Interface
- Large touch targets (minimum 44px)
- Swipe gestures for navigation
- Optimized form inputs for mobile keyboards
- Progressive disclosure to reduce cognitive load

### 2. Performance Optimization
- Lazy loading of onboarding steps
- Offline capability for form data
- Optimized images and assets
- Minimal JavaScript bundle size

### 3. Responsive Design
- Mobile-first design approach
- Adaptive layouts for different screen sizes
- Touch-optimized interactions
- Accessible on all devices

## Success Criteria

### User Experience
- [ ] **Completion Rate:** 85%+ invitation acceptance rate
- [ ] **Time to Complete:** Average onboarding time under 15 minutes
- [ ] **Mobile Experience:** 100% functionality on mobile devices
- [ ] **User Satisfaction:** 4.5+ star rating for onboarding experience

### Technical Performance
- [ ] **Load Time:** Onboarding pages load in under 2 seconds
- [ ] **Error Rate:** <2% technical errors during onboarding
- [ ] **Session Management:** Reliable session persistence and recovery
- [ ] **Data Integrity:** 100% accurate data collection and storage

### Business Objectives
- [ ] **Family Adoption:** 70%+ of family invitations result in multiple accounts
- [ ] **Profile Completion:** 90%+ of users complete required profile sections
- [ ] **Consent Collection:** 100% compliant consent collection for minors
- [ ] **Platform Engagement:** 80%+ of onboarded users active within 7 days

## Implementation Timeline

### Week 1: Core Development
- **Days 1-2:** Onboarding orchestration service and session management
- **Days 3-4:** Family onboarding workflow and profile selection
- **Days 5-6:** Progressive profile setup and completion tracking
- **Day 7:** Mobile optimization and testing

## Risk Mitigation

### User Experience Risks
- **Complexity:** Keep each step simple and focused
- **Abandonment:** Provide clear progress indicators and save progress
- **Technical Issues:** Robust error handling and recovery

### Legal Compliance Risks
- **Consent Collection:** Ensure legally compliant consent processes
- **Data Protection:** Secure handling of sensitive onboarding data
- **Age Verification:** Accurate age verification and parent consent

### Technical Risks
- **Session Management:** Reliable session persistence across devices
- **Performance:** Optimize for mobile and slow connections
- **Integration:** Seamless integration with existing systems

## Next Steps

1. **UX Design:** Create detailed wireframes and user flows
2. **Service Development:** Build core onboarding orchestration services
3. **Component Development:** Create reusable onboarding UI components
4. **Mobile Testing:** Comprehensive testing on mobile devices
5. **Analytics Integration:** Set up onboarding analytics and monitoring

---

*This task creates an intuitive, compliant, and engaging onboarding experience that successfully guides users and families through the registration process while ensuring legal compliance and data protection.*
