# Task 7.15: Service Unit Tests - Test Coverage Implementation

**Status:** 🟡 Planned
**Priority:** Medium
**Duration:** 2 weeks (10 days)
**Parent Task:** Phase 7 - Quality Assurance
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 14

## Overview
Create comprehensive unit tests for critical backend services (FamilyMemberService, PreferencesService, PostingService) to achieve 80%+ code coverage and ensure business logic correctness.

**Target Coverage:** 80% line coverage, 90% branch coverage for critical services

## Functional Requirements

### Services to Test

#### 1. FamilyMemberService
```typescript
// Test coverage areas:
- createFamilyMember()
- getFamilyMembers()
- getFamilyMemberById()
- updateFamilyMember()
- deleteFamilyMember()
- checkPlatformAccess() - age-based rules
- updateParentConsent()
- calculateAccessLevel()
```

#### 2. PreferencesService
```typescript
// Test coverage areas:
- getUserPreferences()
- updatePreferences()
- validateDomainSelection() - max 5 domains
- getPreferencesByFamilyMember()
- setFamilyMemberPreferences()
- getDefaultPreferences()
```

#### 3. PostingService
```typescript
// Test coverage areas:
- createPosting()
- updatePosting()
- deletePosting()
- getPostings() - with filters
- getPostingById()
- calculateExpiryDate() - 30-day minimum
- moderatePosting()
- searchPostings()
```

## Technical Requirements

### Testing Framework Setup

```json
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      lines: 80,
      functions: 80,
      branches: 90,
      statements: 80
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Test Setup File

```typescript
// tests/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { db } from '../src/config/database';

beforeAll(async () => {
  // Connect to test database
  await db.connect();
  
  // Run migrations
  await db.migrate.latest();
});

afterEach(async () => {
  // Clean up test data after each test
  await db('FAMILY_MEMBERS').del();
  await db('USER_PREFERENCES').del();
  await db('POSTINGS').del();
});

afterAll(async () => {
  // Disconnect from database
  await db.destroy();
});
```

### Test Examples

#### FamilyMemberService Tests

```typescript
// tests/services/FamilyMemberService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FamilyMemberService } from '../../src/services/FamilyMemberService';

describe('FamilyMemberService', () => {
  let service: FamilyMemberService;
  let testUserId: string;

  beforeEach(() => {
    service = new FamilyMemberService();
    testUserId = 'test-user-id';
  });

  describe('createFamilyMember', () => {
    it('should create family member with valid data', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        relationship: 'CHILD'
      };

      const member = await service.createFamilyMember(testUserId, data);

      expect(member).toBeDefined();
      expect(member.firstName).toBe('John');
      expect(member.parentUserId).toBe(testUserId);
    });

    it('should throw error for missing required fields', async () => {
      const data = {
        firstName: 'John'
        // Missing lastName and dateOfBirth
      };

      await expect(
        service.createFamilyMember(testUserId, data)
      ).rejects.toThrow('Missing required fields');
    });
  });

  describe('checkPlatformAccess', () => {
    it('should allow access for 18+ members', async () => {
      const member = {
        dateOfBirth: new Date('2000-01-01'),
        hasParentConsent: false
      };

      const canAccess = service.checkPlatformAccess(member);

      expect(canAccess).toBe(true);
    });

    it('should allow access for 14-17 with parent consent', async () => {
      const member = {
        dateOfBirth: new Date('2010-01-01'),
        hasParentConsent: true
      };

      const canAccess = service.checkPlatformAccess(member);

      expect(canAccess).toBe(true);
    });

    it('should deny access for 14-17 without consent', async () => {
      const member = {
        dateOfBirth: new Date('2010-01-01'),
        hasParentConsent: false
      };

      const canAccess = service.checkPlatformAccess(member);

      expect(canAccess).toBe(false);
    });

    it('should deny access for <14 members', async () => {
      const member = {
        dateOfBirth: new Date('2015-01-01'),
        hasParentConsent: true
      };

      const canAccess = service.checkPlatformAccess(member);

      expect(canAccess).toBe(false);
    });
  });
});
```

#### PreferencesService Tests

```typescript
// tests/services/PreferencesService.test.ts
describe('PreferencesService', () => {
  describe('validateDomainSelection', () => {
    it('should allow up to 5 domains', () => {
      const domains = ['domain1', 'domain2', 'domain3', 'domain4', 'domain5'];
      
      expect(() => service.validateDomainSelection(domains)).not.toThrow();
    });

    it('should reject more than 5 domains', () => {
      const domains = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
      
      expect(() => service.validateDomainSelection(domains))
        .toThrow('Maximum 5 domains allowed');
    });

    it('should require at least 1 domain', () => {
      const domains = [];
      
      expect(() => service.validateDomainSelection(domains))
        .toThrow('At least 1 domain required');
    });
  });
});
```

#### PostingService Tests

```typescript
// tests/services/PostingService.test.ts
describe('PostingService', () => {
  describe('calculateExpiryDate', () => {
    it('should use user date if > 30 days', () => {
      const submissionDate = new Date('2025-11-01');
      const userDate = new Date('2025-12-31'); // 60 days out

      const expiry = service.calculateExpiryDate(userDate, submissionDate);

      expect(expiry).toEqual(userDate);
    });

    it('should enforce 30-day minimum if user date < 30 days', () => {
      const submissionDate = new Date('2025-11-01');
      const userDate = new Date('2025-11-15'); // 14 days out

      const expiry = service.calculateExpiryDate(userDate, submissionDate);

      const expectedMinimum = new Date('2025-12-01'); // 30 days
      expect(expiry).toEqual(expectedMinimum);
    });

    it('should default to 30 days if no user date', () => {
      const submissionDate = new Date('2025-11-01');

      const expiry = service.calculateExpiryDate(null, submissionDate);

      const expectedDate = new Date('2025-12-01');
      expect(expiry).toEqual(expectedDate);
    });
  });
});
```

## Implementation Plan

### Week 1: Setup & Core Services
- Day 1: Setup Vitest, coverage config, test utilities
- Days 2-3: FamilyMemberService tests (100% coverage)
- Days 4-5: PreferencesService tests (100% coverage)

### Week 2: PostingService & Integration
- Days 6-8: PostingService tests (100% coverage)
- Day 9: Integration tests, edge cases
- Day 10: Documentation, CI/CD integration

## Success Criteria

- [ ] 80%+ line coverage for all services
- [ ] 90%+ branch coverage for critical paths
- [ ] All business logic edge cases tested
- [ ] Tests run in <10 seconds
- [ ] CI/CD pipeline includes test step
- [ ] Coverage reports generated on each run

## Testing Checklist

### FamilyMemberService (Target: 100%)
- [ ] Create family member - success
- [ ] Create family member - validation errors
- [ ] Get family members - returns correct list
- [ ] Platform access - 18+ allowed
- [ ] Platform access - 14-17 with consent
- [ ] Platform access - 14-17 without consent
- [ ] Platform access - <14 blocked
- [ ] Update family member
- [ ] Delete family member

### PreferencesService (Target: 100%)
- [ ] Get preferences - user exists
- [ ] Get preferences - user doesn't exist
- [ ] Update preferences - success
- [ ] Update preferences - validation (max 5 domains)
- [ ] Update preferences - validation (min 1 domain)
- [ ] Family member preferences
- [ ] Default preferences

### PostingService (Target: 100%)
- [ ] Create posting - success
- [ ] Create posting - validation errors
- [ ] Expiry date - user date > 30 days
- [ ] Expiry date - user date < 30 days
- [ ] Expiry date - no user date (default 30)
- [ ] Update posting
- [ ] Delete posting
- [ ] Search postings - by domain
- [ ] Search postings - by keyword
- [ ] Moderate posting

## Dependencies

### Required Before Starting
- Vitest installed and configured
- Test database setup
- All services implemented

## Related Documentation
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md)
- [Vitest Documentation](https://vitest.dev/)
- [Phase 7 README](./README.md)

---

*This task ensures code quality and business logic correctness through comprehensive unit testing.*
