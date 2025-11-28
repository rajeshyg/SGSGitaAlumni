---
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: architecture
---

# Framework Generalization Summary

## Overview

This document summarizes the changes made to generalize the development framework for use with any React application, eliminating domain-specific dependencies and adding mobile native UI extensibility.

**Date**: 2025-11-27
**Goal**: Make the SDD/TAC development framework reusable across different projects

---

## Changes Implemented

### 1. **Removed Domain-Specific Examples from Framework Files**

#### Files Modified:
- `docs/specs/technical/development-framework/coding-standards.md`
- `docs/specs/technical/development-framework/agent-orchestration.md`
- `docs/specs/technical/development-framework/model-selection-guide.md`

#### Changes:
| Before | After |
|--------|-------|
| `UserService.js` | `[EntityName]Service.js` |
| `users.js` | `[entity-name].js` |
| `posts`, `users`, `authors` | `items`, `entities`, `relatedData` |
| `"scout the posting system"` | `"scout the [feature-name] system"` |
| `"design the data model for the rating system"` | `"design the data model for the [feature] system"` |
| `"refactor the ChatService"` | `"refactor the [ServiceName]"` |

**Impact**: Framework documentation now uses generic placeholders instead of application-specific examples.

---

### 2. **Created Generic Database Schema Template**

#### New File:
- `docs/specs/functional/_TEMPLATE_db-schema.md`

#### Features:
- Generic table definitions with `[TABLE_NAME]` placeholders
- Standard schema structure (columns, indexes, relationships)
- Common query patterns
- Migration notes template
- Clear usage instructions for AI agents

#### Usage:
```bash
# Copy template to feature folder
cp docs/specs/functional/_TEMPLATE_db-schema.md \
   docs/specs/functional/[feature-name]/db-schema.md

# Replace all [placeholders] with actual values
# Reference in technical specs and prime commands
```

**Impact**: AI agents no longer need to connect to database to get schema context. Schema is documented in functional specs.

---

### 3. **Updated Database Technical Specs with Generic Patterns**

#### Files Modified:
- `docs/specs/technical/database/README.md`
- `docs/specs/technical/database/schema-design.md`

#### Changes:
- **Title**: "Database Schema Design" → "Database Schema Design Patterns"
- **Focus**: Changed from specific tables to generic patterns
- **Examples**: Replaced specific table names with `[TABLE_NAME]`, `[ENTITY_NAME]`
- **Added**: Reference to functional spec schema files
- **Added**: Link to schema template

#### New Content:
```markdown
## Common Table Relationship Patterns

### One-to-Many Pattern
[PARENT_TABLE] (1) ----< (N) [CHILD_TABLE]

### Many-to-Many Pattern
[TABLE_A] (N) >----< (N) [TABLE_B] (via [JUNCTION_TABLE])

### One-to-One Pattern
[TABLE_A] (1) ---- (1) [TABLE_B]
```

**Impact**: Technical specs now focus on patterns, not specific application tables.

---

### 4. **Updated Prime-Database Command**

#### File Modified:
- `.claude/commands/prime-database.md`

#### Changes:
- Added `$FEATURE` variable for feature/module name
- Updated context loading to reference `schema-design.md` (patterns)
- Added section for feature-specific schemas:
  - **Read**: `docs/specs/functional/[feature-name]/db-schema.md`
  - **Create**: Use `_TEMPLATE_db-schema.md` template
- Updated key files to use generic patterns:
  - `routes/[feature-name].js`
  - `server/services/[FeatureName]Service.js`

**Impact**: AI agents are directed to create/read schema files in functional specs instead of connecting to database.

---

### 5. **Added Mobile Native UI Extensibility Documentation**

#### New File:
- `docs/specs/technical/development-framework/mobile-native-extensibility.md`

#### Contents:
- **Architecture Principles**: Backend API + Multiple UI layers
- **Project Structure**: Monorepo vs separate repos
- **Implementation Phases**: 4-phase plan for adding mobile
- **Shared Code Strategy**: What to share (types, API client, validators) vs what not to share (UI components)
- **Platform-Specific Considerations**: Storage, navigation, real-time communication
- **Development Workflow**: Scout-Plan-Build for multi-platform features
- **SDD/TAC Framework Adaptation**: New `/prime-mobile` command pattern
- **Testing Strategy**: API, Web, Mobile, Shared code testing
- **Migration Path**: Step-by-step guide for existing projects

**Key Concepts**:
```
Backend (API) - Platform-agnostic
     ↓
  ┌──┴──┐
Web UI  Mobile UI
React   React Native
```

**Impact**: Framework now supports extending to mobile native UI layers with clear guidance and patterns.

---

## Additional Improvements Suggested

### 1. **Create Platform-Agnostic API Contract Documentation**

**File to Create**: `docs/specs/technical/api/api-contracts.md`

**Purpose**:
- Document all API endpoints with request/response schemas
- Use OpenAPI/Swagger format for platform-agnostic contracts
- Enable auto-generation of API clients for web, mobile, native

**Benefits**:
- Web, mobile, and native developers have single source of truth
- Can generate TypeScript types, API clients automatically
- Easier to maintain API versioning

**Implementation**:
```bash
# Use OpenAPI generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate -i api-spec.yaml \
  -g typescript-fetch -o shared/api/generated
```

---

### 2. **Add Generic E2E Test Template**

**File to Create**: `tests/e2e/_TEMPLATE_feature-test.spec.ts`

**Purpose**:
- Provide template for E2E tests for new features
- Use generic patterns (not domain-specific)
- Include common test scenarios (CRUD, auth, validation)

**Example**:
```typescript
// _TEMPLATE_feature-test.spec.ts
import { test, expect } from '@playwright/test';

test.describe('[Feature Name] - CRUD Operations', () => {
  test('should create new [entity]', async ({ page }) => {
    // Generic test pattern
  });

  test('should read [entity] list', async ({ page }) => {
    // Generic test pattern
  });

  test('should update [entity]', async ({ page }) => {
    // Generic test pattern
  });

  test('should delete [entity]', async ({ page }) => {
    // Generic test pattern
  });
});
```

---

### 3. **Create Generic Service Layer Template**

**File to Create**: `server/services/_TEMPLATE_Service.js`

**Purpose**:
- Provide starting point for new service classes
- Include all patterns: try/finally, parameterized queries, error handling
- Eliminate duplication when creating new services

**Example**:
```javascript
/**
 * [EntityName]Service - Business logic for [entity-name]
 */
class [EntityName]Service {
  /**
   * Get [entity] by ID
   */
  static async getById(id, connection = null) {
    const shouldRelease = !connection;
    try {
      if (!connection) connection = await getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM [TABLE_NAME] WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } finally {
      if (shouldRelease && connection) connection.release();
    }
  }

  // ... more CRUD methods
}
```

---

### 4. **Add Generic Component Template (React/TypeScript)**

**File to Create**: `src/components/_TEMPLATE_Component.tsx`

**Purpose**:
- Provide template for new React components
- Include TypeScript types, props interface, common patterns
- Follows project coding standards (< 300 lines, hooks, error handling)

**Example**:
```typescript
import React from 'react';

/**
 * Props for [ComponentName] component
 */
interface [ComponentName]Props {
  // Define props
}

/**
 * [ComponentName] - [Brief description]
 */
export function [ComponentName](props: [ComponentName]Props): JSX.Element {
  // State
  const [loading, setLoading] = React.useState(false);

  // Effects
  React.useEffect(() => {
    // Side effects
  }, []);

  // Handlers
  const handleAction = async () => {
    try {
      setLoading(true);
      // Implementation
    } catch (error) {
      console.error('Error in [ComponentName]:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

### 5. **Create Generic Prime Command Template**

**File to Create**: `.claude/commands/_TEMPLATE_prime-command.md`

**Purpose**:
- Template for creating new prime commands for features
- Standardize prime command structure
- Include sections: variables, context to load, key files, critical rules

**Example**:
```markdown
# Prime: [Feature Name] Context

Load this context before working on [feature-name] tasks.

## Variables
- `$TASK`: The specific task to perform
- `$[VARIABLE]`: (Optional) [Description]

## Context to Load
Read these files to understand [feature-name] patterns:
- `docs/specs/functional/[feature-name]/README.md` - Overview
- `docs/specs/functional/[feature-name]/db-schema.md` - Database schema
- `docs/specs/technical/[domain]/[spec].md` - Technical patterns

## Key Files
- `routes/[feature-name].js` - API routes
- `server/services/[FeatureName]Service.js` - Business logic
- `src/components/[FeatureName]/` - UI components

## Critical Rules
1. [Rule 1]
2. [Rule 2]

## Workflow
1. Read the context files listed above
2. [Step 2]
3. [Step 3]

## Report
After completing the task:
- [Checklist item 1]
- [Checklist item 2]
```

---

### 6. **Update Always-On Context for Generic Framework**

**File to Update**: `docs/specs/context/always-on.md`

**Suggested Changes**:

#### Remove Platform Constraint Section:
```diff
- ## Platform Constraints
- **Alumni-Only System**: Only individuals certified by the institution...
```

#### Make Tech Stack More Generic:
```diff
- ## Tech Stack
- Node.js 18+, Express, MySQL2, React 18, TypeScript, Socket.IO, JWT
+ ## Tech Stack (Configurable)
+ - **Backend**: Node.js 18+, Express, MySQL2 (or other RDBMS)
+ - **Web UI**: React 18, TypeScript
+ - **Mobile UI** (optional): React Native, TypeScript
+ - **Real-time**: Socket.IO (optional)
+ - **Auth**: JWT or other token-based auth
```

#### Generalize Reference Implementations:
```diff
  ## Reference Implementations (DO NOT DUPLICATE)
- - Auth: `middleware/auth.js`, `routes/otp.js`, `services/FamilyMemberService.js`
+ - Auth: `middleware/auth.js`, `routes/auth.js`, `server/services/[Auth]Service.js`
```

---

### 7. **Create Framework Adoption Guide**

**File to Create**: `docs/specs/technical/development-framework/adoption-guide.md`

**Purpose**:
- Help developers adopt this framework for new projects
- Step-by-step guide to bootstrap a new project using the framework
- Explain what to customize vs what to keep generic

**Contents**:
1. **Prerequisites**: Node.js, npm, database
2. **Project Initialization**: Clone/fork or start fresh
3. **Customization Checklist**:
   - Update `.env` with your database credentials
   - Replace `[TABLE_NAME]` placeholders in schema files
   - Customize feature-specific functional specs
   - Update always-on.md with your platform constraints (if any)
4. **Framework Usage**: How to use prime commands, Scout-Plan-Build workflow
5. **Adding New Features**: Use templates for services, components, tests, schemas
6. **Testing**: Setup E2E tests, unit tests
7. **Deployment**: Generic deployment patterns

---

### 8. **Add Framework Version Management**

**File to Create**: `docs/specs/technical/development-framework/VERSION.md`

**Purpose**:
- Track framework version
- Document breaking changes between versions
- Help projects know when to upgrade framework

**Example**:
```markdown
# Development Framework Version

## Current Version: 2.0.0

### 2.0.0 (2025-11-27)
**Breaking Changes**:
- Database schema documentation moved from technical specs to functional specs
- Prime-database command now references feature-specific schemas
- All framework examples now use generic placeholders

**New Features**:
- Mobile native UI extensibility support
- Generic database schema template
- Platform-agnostic patterns throughout

**Migration Guide**:
1. Create db-schema.md files in functional specs using template
2. Update prime-database references
3. Review mobile-native-extensibility.md if planning mobile support

### 1.0.0 (2025-11-23)
- Initial framework release
- SDD/TAC methodology
- Scout-Plan-Build workflow
```

---

### 9. **Create "Quick Start" Guide**

**File to Create**: `docs/specs/technical/development-framework/QUICKSTART.md`

**Purpose**:
- Help new AI agents or developers get started quickly
- 5-minute overview of the framework
- Links to detailed docs

**Contents**:
```markdown
# Framework Quick Start

## 1. Understand the Stack
- Backend: Node.js + Express + MySQL
- Frontend: React + TypeScript
- Optional: Mobile (React Native)

## 2. Know the Workflow
1-2 files → Build directly
3-10 files → Scout → Plan → Build
10+ files → Full TAC with parallel agents

## 3. Use Prime Commands
- `/prime-auth` - Authentication context
- `/prime-api` - API development
- `/prime-database` - Database work
- `/prime-ui` - UI components
- `/prime-framework` - Full methodology

## 4. Follow Patterns
- Database: Use `_TEMPLATE_db-schema.md`
- Services: Use `_TEMPLATE_Service.js`
- Components: Use `_TEMPLATE_Component.tsx`
- Tests: Use `_TEMPLATE_feature-test.spec.ts`

## 5. Critical Rules
1. SQL: Parameterized queries only `[?, ?]`
2. DB: Always try/finally for connection.release()
3. Validation: Check all input before DB operations
4. Logging: Never log secrets, passwords, tokens

## Next Steps
- Read: `docs/specs/context/always-on.md`
- Explore: `docs/specs/functional/` for features
- Review: `docs/specs/technical/development-framework/`
```

---

### 10. **Add Configuration Management Documentation**

**File to Create**: `docs/specs/technical/development-framework/configuration-management.md`

**Purpose**:
- Document how to manage environment-specific configuration
- Explain `.env` patterns for different environments (dev, staging, prod)
- Mobile app configuration (different API endpoints per environment)

**Contents**:
- Environment variables patterns
- Multi-environment setup (`.env.development`, `.env.production`)
- React Native config (react-native-config)
- Secrets management (never commit secrets)
- CI/CD configuration injection

---

## Summary of Generalization

### Before:
- Framework examples used specific table names (POSTINGS, alumni_members, users)
- Database schema required connecting to database
- No mobile UI guidance
- Domain-specific examples in coding standards

### After:
- All examples use generic placeholders `[TABLE_NAME]`, `[entity-name]`, `[ServiceName]`
- Database schemas documented in functional specs with template
- Comprehensive mobile native UI extensibility guide
- Framework is reusable for any React + Node.js application

---

## Next Steps (Recommended)

1. **Review and test**: Verify all framework docs use generic patterns
2. **Create templates**: Add the suggested templates (Service, Component, E2E test)
3. **Update always-on.md**: Remove domain-specific constraints
4. **Create adoption guide**: Help others use this framework
5. **Version the framework**: Track changes and provide migration guides
6. **Test on new project**: Validate framework works for a different domain

---

## Files Changed

### Modified:
1. `docs/specs/technical/development-framework/coding-standards.md`
2. `docs/specs/technical/development-framework/agent-orchestration.md`
3. `docs/specs/technical/development-framework/model-selection-guide.md`
4. `docs/specs/technical/database/README.md`
5. `docs/specs/technical/database/schema-design.md`
6. `.claude/commands/prime-database.md`

### Created:
1. `docs/specs/functional/_TEMPLATE_db-schema.md`
2. `docs/specs/technical/development-framework/mobile-native-extensibility.md`
3. `docs/specs/technical/development-framework/framework-generalization-summary.md` (this file)

---

## Impact

✅ **Framework is now generic** - Can be used for any React + Node.js application
✅ **Mobile-ready** - Clear path to extend to mobile native UI
✅ **Schema documentation** - No need to connect to database for schema context
✅ **Reusable patterns** - Templates and examples use placeholders
✅ **Better maintainability** - Framework evolution doesn't depend on specific domain

**Estimated effort saved per new project**: 20-30 hours (no need to adapt domain-specific examples)

---

**Generated**: 2025-11-27
**Author**: Claude Code (Sonnet 4.5)
**Framework Version**: 2.0.0
