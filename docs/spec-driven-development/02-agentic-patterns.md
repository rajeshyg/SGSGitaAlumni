# Module 2: Agentic Prompt Engineering Patterns

[← Previous: Understanding SDD](./01-understanding-sdd.md) | [Back to Guide](./README.md) | [Next: Context Engineering →](./03-context-and-orchestration.md)

---

## The Input-Workflow-Output Pattern

Every agentic prompt should follow this structure:

### Input Section
```markdown
## Input
- **User Prompt**: {{ user_request }}
- **Relevant Files**: {{ file_list }}
- **Context**: {{ project_context }}
- **Constraints**: {{ limitations }}
```

### Workflow Section
```markdown
## Workflow
1. **Analyze**: Review the specification and existing code
2. **Design**: Create a detailed implementation approach
3. **Implement**: Write the code following the plan
4. **Verify**: Run tests and validate output
5. **Document**: Update relevant documentation
```

### Output Section
```markdown
## Output
- **Format**: Code diffs, new files, or complete implementations
- **Structure**: [Specify JSON, YAML, or file structure]
- **Required Elements**:
  - Implementation summary
  - Test results
  - Documentation updates
```

---

## Progressive Complexity Levels

### Level 1: Simple Workflow Prompt
```markdown
You are a backend engineer implementing API endpoints.

## Workflow
1. Read the API specification from spec/api.md
2. Implement the endpoint in src/routes/
3. Add validation using Zod
4. Write unit tests in tests/
5. Update the OpenAPI schema

## Output
- New route file
- Test file with 100% coverage
- Updated openapi.yaml
```

### Level 2: Control Flow Prompt
```markdown
You are a migration specialist.

## Workflow
1. Check if backup exists:
   - IF backup exists: proceed
   - ELSE: create backup first
2. For each table in migration list:
   - Validate schema compatibility
   - IF incompatible: log error and skip
   - ELSE: run migration
3. IF any errors occurred:
   - Rollback all changes
   - Restore backup
4. Verify data integrity
5. IF verification fails: STOP and alert

## Output
- Migration log
- Validation report
- Rollback scripts (if needed)
```

### Level 3: Delegation Prompt (Multi-Agent)
```markdown
You are the orchestrator agent for a feature implementation.

## Workflow
1. Create Scout Agent:
   - Task: Identify all files related to user authentication
   - Output: file_list.json
   
2. Create Planner Agent:
   - Input: file_list.json, spec/auth-feature.md
   - Task: Design implementation approach
   - Output: implementation_plan.md
   
3. Create Builder Agents (parallel):
   - Builder-Backend: Implement API changes
   - Builder-Frontend: Implement UI changes
   - Input: implementation_plan.md
   
4. Create QA Agent:
   - Input: Changes from all builders
   - Task: Run full test suite and integration tests
   - Output: test_report.md

## Output
- Orchestration log
- All sub-agent outputs
- Final integration summary
```

---

## Composable Prompt Sections

Build a library of reusable sections:

### Metadata Section (C-Tier)
```markdown
## Metadata
- **Prompt ID**: auth-implementation-v2
- **Version**: 2.1.0
- **Author**: Engineering Team
- **Allowed Models**: claude-sonnet-4, gpt-4
- **Allowed Tools**: file_read, file_write, terminal
```

### Purpose Section (Essential)
```markdown
## Purpose
Implement OAuth 2.0 authentication flow with JWT tokens, replacing the legacy session-based authentication.
```

### Variables Section (A-Tier)
```markdown
## Variables
- **DYNAMIC**:
  - user_request: {{ provided_at_runtime }}
  - target_files: {{ discovered_by_agent }}
  
- **STATIC**:
  - output_dir: ./src/auth/
  - test_dir: ./tests/auth/
  - config_file: ./config/auth.yaml
```

### Instructions Section (B-Tier)
```markdown
## Instructions
- Follow the project's TypeScript style guide
- All async operations must have timeout handlers
- Use the existing logger (src/utils/logger.ts)
- Do not modify database schema without migration
- All strings must be internationalized (i18n)
```

### Codebase Structure Section (C-Tier)
```markdown
## Codebase Structure
- **Authentication**: src/auth/ - Current session-based auth
- **API Routes**: src/routes/api/ - RESTful endpoints
- **Middleware**: src/middleware/ - Express middleware
- **Database**: src/db/ - Prisma ORM models
- **Tests**: tests/ - Jest test suites
```

---

## Practical Examples

### Example 1: API Endpoint Implementation

```markdown
# Prompt: Create User Profile Endpoint

## Input
- Specification: specs/features/user-profile.md
- Existing Auth: src/middleware/auth.ts
- Database Schema: prisma/schema.prisma

## Workflow
1. Read the specification to understand requirements
2. Review existing authentication middleware
3. Check current database schema for user table
4. Implement POST /api/users/:id/profile endpoint
5. Add input validation (name, bio, avatar)
6. Write unit tests covering:
   - Successful profile update
   - Invalid input handling
   - Authorization checks
   - Missing user handling
7. Update API documentation

## Output
- src/routes/users.ts (modified)
- tests/routes/users.test.ts (new)
- docs/api/endpoints.md (updated)
```

### Example 2: Bug Fix with Context

```markdown
# Prompt: Fix Memory Leak in WebSocket Handler

## Input
- Bug Report: issues/142-websocket-memory-leak.md
- Affected File: src/websocket/handler.ts
- Monitoring Data: logs/memory-profile.json

## Workflow
1. Read the bug report to understand symptoms
2. Analyze the WebSocket handler implementation
3. Review memory profiling data
4. Identify the leak source (likely event listener not cleaned up)
5. Implement fix:
   - Add cleanup in disconnect handler
   - Use WeakMap for client tracking
   - Clear intervals/timeouts properly
6. Add test to verify leak is fixed
7. Document the fix and prevention measures

## Output
- src/websocket/handler.ts (fixed)
- tests/websocket/memory-leak.test.ts (new)
- docs/lessons-learned/websocket-memory-management.md (new)
```

### Example 3: Refactoring Task

```markdown
# Prompt: Extract Validation Logic to Reusable Module

## Input
- Target Files: src/routes/*.ts (all routes with inline validation)
- Requirements: Create centralized validation module
- Validation Library: Zod (already in use)

## Workflow
1. Scan all route files for validation patterns
2. Identify common validation logic:
   - Email format
   - Phone number format
   - Date ranges
   - String lengths
3. Create src/validation/schemas.ts with Zod schemas
4. Create src/validation/middleware.ts for Express integration
5. Refactor each route file to use centralized validation
6. Ensure all existing tests still pass
7. Add new tests for validation module

## Output
- src/validation/schemas.ts (new)
- src/validation/middleware.ts (new)
- src/routes/*.ts (refactored - 8 files)
- tests/validation/ (new test suite)
```

---

## Best Practices for Prompt Engineering

### 1. Be Explicit, Not Implicit
❌ **Bad**: "Make the API endpoint"
✅ **Good**: "Create a POST endpoint at /api/users/:id/profile that accepts name, bio, and avatar fields"

### 2. Provide Context, Not Just Tasks
❌ **Bad**: "Fix the bug in handler.ts"
✅ **Good**: "Fix the memory leak in handler.ts (line 45) where WebSocket event listeners aren't cleaned up on disconnect"

### 3. Specify Constraints
```markdown
## Constraints
- Must maintain backward compatibility with v1 API
- Cannot modify database schema (use existing columns)
- Maximum response time: 100ms
- Must support Node.js 18+
```

### 4. Define Success Criteria
```markdown
## Success Criteria
- [ ] All unit tests pass (minimum 90% coverage)
- [ ] Integration tests pass
- [ ] API documentation updated
- [ ] No breaking changes to existing API
- [ ] Performance benchmarks meet targets
```

### 5. Include Examples
```markdown
## Example Input
```json
{
  "name": "John Doe",
  "bio": "Software engineer",
  "avatar": "https://example.com/avatar.jpg"
}
```

## Example Output
```json
{
  "success": true,
  "profile": {
    "id": "123",
    "name": "John Doe",
    "bio": "Software engineer",
    "avatar": "https://example.com/avatar.jpg",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```
```

---

## Prompt Template Library

### Template 1: Feature Implementation
```markdown
# Feature Implementation: {{ FEATURE_NAME }}

## Input
- Specification: {{ SPEC_PATH }}
- Affected Files: {{ FILE_LIST }}
- Dependencies: {{ DEPENDENCIES }}

## Workflow
1. Review specification and understand requirements
2. Analyze existing code structure
3. Implement core functionality
4. Add error handling
5. Write comprehensive tests
6. Update documentation

## Constraints
{{ PROJECT_CONSTRAINTS }}

## Output
- Implementation files
- Test suite with {{ MIN_COVERAGE }}% coverage
- Updated documentation
```

### Template 2: Code Review
```markdown
# Code Review Request

## Input
- Pull Request: {{ PR_NUMBER }}
- Changed Files: {{ FILE_LIST }}
- Specification: {{ SPEC_PATH }}

## Review Checklist
1. **Spec Compliance**:
   - [ ] All requirements implemented
   - [ ] Success criteria met
   
2. **Code Quality**:
   - [ ] Follows project style guide
   - [ ] No code smells or anti-patterns
   - [ ] Appropriate error handling
   
3. **Testing**:
   - [ ] Test coverage meets minimum ({{ MIN_COVERAGE }}%)
   - [ ] Edge cases covered
   - [ ] Integration tests included
   
4. **Documentation**:
   - [ ] API docs updated
   - [ ] Comments for complex logic
   - [ ] README updated if needed

## Output
- Review report with findings
- Suggested improvements
- Approval status
```

### Template 3: Migration Plan
```markdown
# Migration Planning: {{ MIGRATION_NAME }}

## Input
- Current State: {{ CURRENT_SCHEMA }}
- Desired State: {{ TARGET_SCHEMA }}
- Data Volume: {{ ROW_COUNT }} rows

## Workflow
1. Analyze schema differences
2. Design migration steps
3. Create rollback plan
4. Estimate downtime
5. Identify risks
6. Generate migration scripts

## Safety Checks
- Backup verification required
- Test on staging environment
- Dry-run validation
- Performance impact assessment

## Output
- Migration SQL scripts
- Rollback scripts
- Validation queries
- Risk assessment document
```

---

## Key Takeaways

1. **Structure is Critical**: Use Input-Workflow-Output pattern consistently
2. **Progressive Complexity**: Start simple, add control flow, then delegation
3. **Reusable Sections**: Build a library of composable prompt components
4. **Be Explicit**: Specify constraints, success criteria, and expected outputs
5. **Context Matters**: Provide relevant files, specs, and project information

---

## Next Steps

Learn how to manage context effectively and orchestrate multiple agents:

**[Continue to Module 3: Context Engineering & Multi-Agent Systems →](./03-context-and-orchestration.md)**

Or return to the [main guide](./README.md) to choose a different module.
