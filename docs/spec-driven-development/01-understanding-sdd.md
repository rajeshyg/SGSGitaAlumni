# Module 1: Understanding Spec-Driven Development

[← Back to Guide](./README.md) | [Next: Agentic Patterns →](./02-agentic-patterns.md)

---

## 1. Understanding Spec-Driven Development

### What is Spec-Driven Development?

Spec-driven development is a methodology where you write detailed specifications before code, using these specs to guide AI assistants through implementation. Unlike "vibe coding" (ad-hoc prompting), SDD creates a clear contract between human intent and AI execution.

### Three Paradigms of SDD

1. **Spec-First**: Write specifications before implementation
2. **Spec-Anchored**: Maintain specs throughout the project lifecycle for evolution and maintenance
3. **Spec-as-Source**: Specs become the primary artifact; code is generated and potentially regenerable

### Why Spec-Driven Development?

**Problems with Vibe Coding:**
- Context loss as conversations grow
- Inconsistent outputs and architectural drift
- Difficulty in code review and maintenance
- Repeated explanations of project intent
- Unpredictable quality and completeness

**Benefits of SDD:**
- Predictable, repeatable results
- Clear audit trail of decisions
- Easier collaboration and handoffs
- Better code quality and architecture consistency
- Reduced debugging and rework time
- Scalable to team workflows

---

## 2. The Three Levels of SDD

### Level 1: Documentation-First Development
**Approach**: Write specs as documentation, then use them to guide AI coding

**Characteristics**:
- Specs live alongside code
- Manual coordination between spec and implementation
- Good for greenfield projects
- Low complexity, immediate value

### Level 2: Specification-Anchored Workflow
**Approach**: Specs become living documents that evolve with the codebase

**Characteristics**:
- Specs maintained during refactoring and evolution
- Used for onboarding and architectural decisions
- Supports brownfield/legacy modernization
- Medium complexity, high long-term value

### Level 3: Specification-as-Source
**Approach**: Specs are the primary source; code is fully generated

**Characteristics**:
- Code marked as "GENERATED - DO NOT EDIT"
- Modifications happen only in specs
- Full regeneration capability
- High complexity, maximum automation

**Recommendation**: Start with Level 1, evolve to Level 2 for production systems. Level 3 is experimental but promising for specific domains.

---

## 3. Core Framework: Constitution-Spec-Plan-Tasks

This four-phase workflow is platform-agnostic and adaptable to any AI coding assistant.

### Phase 1: Constitution (Memory Bank)

**Purpose**: Establish immutable principles and context that apply to all changes.

**What to Include**:
- Project architecture overview
- Technology stack and constraints
- Code style and conventions
- Security and compliance requirements
- Team practices and patterns
- Domain-specific terminology

**Implementation**:
- Single file: `constitution.md` or `project-memory.md`
- Keep under 2000 words for context efficiency
- Update rarely, only for foundational changes

**Example Structure**:
```markdown
# Project Constitution

## Architecture
- Microservices with event-driven communication
- React frontend, Node.js backend
- PostgreSQL for transactional data, Redis for caching

## Principles
- API-first design with OpenAPI specs
- Test coverage minimum 80%
- No direct database access from frontend
- All async operations use job queues

## Constraints
- Maximum response time: 200ms
- Support Node.js 18+
- WCAG 2.1 AA accessibility compliance
```

### Phase 2: Specify

**Purpose**: Define WHAT needs to be built and WHY.

**Structure**:
```markdown
# Feature Specification: [Feature Name]

## Goal
[One paragraph: what problem does this solve?]

## User Stories
- As a [role], I want [capability] so that [benefit]
- [Additional stories...]

## Requirements
### Functional
- [Specific capability 1]
- [Specific capability 2]

### Non-Functional
- Performance: [metrics]
- Security: [requirements]
- Accessibility: [standards]

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2]

## Out of Scope
- [Explicitly excluded items]
```

**Best Practices**:
- Focus on outcomes, not implementation
- Include user perspective
- Define success criteria clearly
- Explicitly state what's NOT included
- Use examples and edge cases

### Phase 3: Plan

**Purpose**: Define HOW to implement the specification.

**Structure**:
```markdown
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentences on approach]

## Architecture Changes
- [Component modifications]
- [New services/modules]
- [Database schema changes]

## Implementation Steps
1. [Phase 1: Foundation]
   - [Step 1.1]
   - [Step 1.2]
   
2. [Phase 2: Core Logic]
   - [Step 2.1]
   - [Step 2.2]

3. [Phase 3: Integration]
   - [Step 3.1]
   - [Step 3.2]

## Dependencies
- [External libraries]
- [Other features/services]
- [Infrastructure requirements]

## Testing Strategy
- Unit tests: [coverage areas]
- Integration tests: [scenarios]
- E2E tests: [critical paths]

## Risks and Mitigations
- [Risk 1]: [Mitigation approach]
- [Risk 2]: [Mitigation approach]

## Rollout Plan
- [Deployment strategy]
- [Feature flags]
- [Monitoring approach]
```

**Best Practices**:
- Break into concrete, sequential phases
- Identify dependencies early
- Include testing at every level
- Consider rollback scenarios
- Document assumptions

### Phase 4: Tasks

**Purpose**: Create atomic, actionable work units for AI execution.

**Structure**:
```markdown
# Task Breakdown: [Feature Name]

## Task 1: [Descriptive Name]
**Status**: Not Started | In Progress | Complete
**Depends On**: [Task IDs]
**Estimated Complexity**: Low | Medium | High

### Objective
[One sentence: what does this task accomplish?]

### Context
[Files to read, existing code to understand]

### Implementation Details
- [Specific change 1]
- [Specific change 2]

### Acceptance Criteria
- [ ] [Verifiable criterion 1]
- [ ] [Verifiable criterion 2]

### Testing Requirements
- [ ] [Test case 1]
- [ ] [Test case 2]

---

## Task 2: [Next Task]
[...]
```

**Best Practices**:
- Each task should be completable in one AI session
- Tasks should be independent where possible
- Include clear acceptance criteria
- Reference specific files and functions
- Specify expected inputs and outputs

---

## Key Takeaways

1. **Specs First, Code Second**: Write clear specifications before engaging AI assistants
2. **Four-Phase Framework**: Constitution → Specify → Plan → Tasks
3. **Progressive Levels**: Start with Level 1 (Documentation-First), evolve to Level 2 (Spec-Anchored)
4. **Clear Boundaries**: Each phase has a specific purpose and output format
5. **Platform-Agnostic**: This framework works with any AI coding tool

---

## Next Steps

Now that you understand the SDD fundamentals, learn how to craft effective prompts for AI assistants:

**[Continue to Module 2: Agentic Prompt Engineering →](./02-agentic-patterns.md)**

Or return to the [main guide](./README.md) to choose a different module.
