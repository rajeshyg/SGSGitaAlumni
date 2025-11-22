# User Management - Functional Specification

## Goal
Enable users to manage their profiles, preferences, and interests for effective community networking and content matching.

## Features

### 1. Alumni Profiles
**Status**: In Progress

- View and edit profile information
- Contact details, education, profession
- Skills and expertise areas

**Pending Work**:
- Complete profile editing UI (Task 7.6)
- Profile picture upload
- Extended profile fields

### 2. Profile Selection
**Status**: Complete

- Netflix-style family member selector
- Visual profile cards with avatars
- Quick switching between family accounts

### 3. User Preferences
**Status**: In Progress

**Requirements**:
- Domain, sub-domain, and areas of interest selection
- Maximum 5 domains per user (enforce UI validation)
- Hierarchical taxonomy navigation

**Acceptance Criteria**:
- [ ] Users can select up to 5 domains
- [ ] Sub-domains filtered by selected domains
- [ ] Areas of interest filtered by sub-domains
- [ ] Validation prevents exceeding 5-domain limit
- [ ] Preferences persisted to database

### 4. Matching Posts
**Status**: Complete

- Search postings by Domain, Sub-Domain, Areas of Interest
- Personalized feed based on user preferences
- Filter and sort capabilities

### 5. Profile Pictures & Extended Attributes
**Status**: Pending

**Requirements**:
- Profile photo upload (max 5MB, jpg/png)
- Image cropping and preview
- Additional fields: bio, social links, achievements

**Out of Scope**:
- Photo galleries
- Video introductions
