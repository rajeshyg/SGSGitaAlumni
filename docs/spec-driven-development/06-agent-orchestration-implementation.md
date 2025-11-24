# Agent Orchestration Implementation Guide

> **Purpose**: Concrete instructions for triggering and coordinating AI agents in Claude Code and other tools.

This guide bridges the gap between SDD theory (Modules 1-5) and practical execution. After reading this, you'll know exactly how to create, trigger, and coordinate agents.

---

## How Agents Actually Work

### The Reality of "Sub-Agents"

When documentation says "create a Scout agent", it means:

```
NOT: Some automatic system spawns agents
IS:  You manually invoke agents with focused prompts and context
```

**Key Insight**: You are the orchestrator. The "agent" is Claude with specific context and instructions.

---

## Claude Code Agent Triggering

### Method 1: Task Tool (Recommended)

Claude Code's **Task tool** is the primary mechanism for sub-agent delegation:

```markdown
# Example: Creating a Scout Agent

You: "Search the codebase to find all files related to user authentication"

Claude uses Task tool internally:
- subagent_type: "Explore"
- model: "haiku" (fast, cheap)
- Returns: list of relevant files
```

**How to trigger this yourself**:
```markdown
# Your prompt to Claude Code:

Use the Task tool with subagent_type=Explore to find all files related to
user authentication. This is a research task - don't modify any files.
Return a comprehensive list with file paths and descriptions.
```

### Method 2: Explicit Agent Instructions

Tell Claude exactly what agent role to assume:

```markdown
# Scout Agent Prompt Template

You are a **Scout Agent**. Your ONLY job is reconnaissance.

CONSTRAINTS:
- Do NOT modify any files
- Do NOT write code
- Do NOT make implementation decisions
- ONLY identify and catalog

TASK: Find all files related to [FEATURE]

OUTPUT FORMAT:
## Discovered Files
- path/to/file.ts - Description of what it does
- path/to/related.ts - Description

## Key Patterns Found
- Pattern 1
- Pattern 2

## Recommendations for Planning
- Consideration 1
- Consideration 2
```

### Method 3: Parallel Agent Execution

For multiple independent tasks, request parallel execution:

```markdown
# Your prompt:

I need THREE agents working in parallel:

1. **Scout-Frontend**: Find all React components related to user profiles
2. **Scout-Backend**: Find all API routes related to user management
3. **Scout-Database**: Find all database schemas for users

Run these as parallel Task tool calls and return combined results.
```

---

## Complete Workflow: Scout-Plan-Build

### Step 1: Scout Phase

**Trigger the Scout agent**:
```markdown
# Prompt to Claude Code

Execute Scout phase for implementing [FEATURE NAME].

Use Task tool with subagent_type=Explore (haiku model) to:
1. Find all existing files related to this feature
2. Identify patterns and conventions used
3. Note any dependencies or integrations
4. List potential impact areas

Output a structured scout report I can feed to the Planner.
```

**Expected Output**: Scout report saved or returned

### Step 2: Plan Phase

**Trigger the Planner agent**:
```markdown
# Prompt to Claude Code

Execute Plan phase for [FEATURE NAME].

CONTEXT:
[Paste scout report here OR reference file path]

Create an implementation plan with:
1. Architecture decisions
2. File changes required (new files, modified files)
3. Sequence of implementation
4. Risk areas and mitigations
5. Testing strategy

Do NOT write code yet. Output a detailed plan document.
```

**Expected Output**: Implementation plan

### Step 3: Build Phase

**Trigger Builder agent(s)**:
```markdown
# Prompt to Claude Code

Execute Build phase for [FEATURE NAME].

PLAN:
[Paste plan OR reference file path]

Implement the plan step by step:
1. Create/modify files as specified
2. Follow existing code patterns
3. Add appropriate tests
4. Update documentation if needed

Report progress after each major step.
```

---

## Context Priming Commands

This project has pre-built context priming commands in `.claude/commands/`:

### Usage

```bash
# Before working on authentication
/prime-auth

# Before API development
/prime-api

# Before database work
/prime-database

# Before UI development
/prime-ui
```

### How They Work

Each command loads relevant specs and context:
- Constitution principles
- Feature specifications
- Technical standards
- Reference implementations

This "primes" the agent with 60-70% of needed context before you give the actual task.

---

## Orchestrator Pattern Implementation

For complex features requiring multiple coordinated agents:

### Step-by-Step Orchestration Script

```markdown
# Your prompt to Claude Code

I need you to act as an **Orchestrator** for implementing [FEATURE].

Execute this workflow:

## Phase 1: Reconnaissance
Create parallel Scout agents (use Task tool):
- scout-frontend: Find UI components
- scout-backend: Find API routes
- scout-database: Find schemas

Wait for all scouts to complete.

## Phase 2: Planning
Create Planner agent with combined scout outputs.
Generate comprehensive implementation plan.

## Phase 3: Building
Based on the plan, create Builder agents:
- If changes are independent: run in parallel
- If changes have dependencies: run sequentially

## Phase 4: Verification
Create QA agent to:
- Run existing tests
- Verify new functionality
- Check for regressions

Report final status with summary of all changes made.
```

---

## Agent Communication Patterns

### Pattern 1: File-Based Handoff

Agents communicate via files:

```
scout-output.md → Planner reads → plan-output.md → Builder reads
```

**Implementation**:
```markdown
Scout Agent: Save your findings to docs/specs/workflows/[feature]/scout.md

Planner Agent: Read docs/specs/workflows/[feature]/scout.md and output to plan.md

Builder Agent: Read plan.md and implement
```

### Pattern 2: Context Bundle

For session continuity:

```markdown
# At end of session, create context bundle:

Create a context_bundle.md with:
- Summary of what was done
- Current state
- Decisions made
- Next steps
- Key file references

This bundle can restore ~70% of context in a new session.
```

### Pattern 3: Inline Results

For simple workflows, pass results directly in prompts:

```markdown
# Scout result passed to Planner

SCOUT FINDINGS:
[Inline the scout output here]

Based on these findings, create an implementation plan...
```

---

## Model Selection Guide

| Agent Type | Model | Reason |
|------------|-------|--------|
| Scout | Haiku | Fast, cheap reconnaissance |
| Planner | Sonnet | Needs thorough analysis |
| Builder | Sonnet | Quality code generation |
| QA | Sonnet | Thorough testing |
| Orchestrator | Sonnet/Opus | Complex coordination |

**In Claude Code Task tool**:
```markdown
Use Task tool with model="haiku" for scout tasks
Use Task tool with model="sonnet" for planning/building
```

---

## Error Handling

### Agent Failure Recovery

```markdown
# If a Builder agent fails:

1. Review the error message
2. Check if it's a context issue (missing information)
3. If missing context: Re-run scout for that specific area
4. If code issue: Give Builder more specific instructions
5. If fundamental issue: Escalate to Planner to revise approach
```

### Parallel Agent Conflicts

When parallel agents modify the same files:

```markdown
# Resolution strategy:

1. Run agents sequentially instead of parallel
2. OR assign clear file ownership to each agent
3. OR use a merge agent to reconcile changes
```

---

## Practical Examples

### Example 1: Add Bio Field to User Profile

```markdown
# Full orchestration prompt

Implement adding a bio field to user profiles using Scout-Plan-Build:

SCOUT PHASE:
Use Task tool (Explore, haiku) to find:
- User profile components
- User API routes
- User database schema
- Related tests

PLAN PHASE:
Based on scout findings, create plan for:
- Database migration
- API endpoint updates
- UI component changes
- Test updates

BUILD PHASE:
Implement the plan. Run tests after each major change.

Report progress throughout.
```

### Example 2: Quick Bug Fix (Skip Scout)

For simple, localized fixes:

```markdown
# Direct build prompt

Bug: User avatar not displaying on mobile

This is a simple UI bug. Skip Scout phase.

PLAN (inline):
1. Find avatar component
2. Check responsive styles
3. Fix mobile breakpoint

BUILD:
Implement the fix and test on mobile viewport.
```

### Example 3: Research Task (Scout Only)

```markdown
# Scout-only task

I need to understand how error handling works across the application.

Execute Scout phase only:
- Find all error handling patterns
- Identify inconsistencies
- Document current approaches
- Note improvement opportunities

Do NOT make any changes. Output a comprehensive research report.
```

---

## Integration with Project Workflows

This project has existing workflow documentation in `docs/specs/workflows/`:

### Reading Existing Workflows

```markdown
# To continue work on postings feature:

Read the existing workflow:
1. docs/specs/workflows/postings/scout.md - Previous reconnaissance
2. docs/specs/workflows/postings/plan.md - Implementation plan
3. docs/specs/workflows/postings/tasks.md - Task breakdown

Resume from where the previous agent left off.
```

### Creating New Workflows

```markdown
# For a new feature:

1. Create folder: docs/specs/workflows/[feature-name]/
2. Run Scout → save to scout.md
3. Run Plan → save to plan.md
4. Run Build → update tasks.md with progress
```

---

## Quick Reference

### Minimal Scout-Plan-Build

```markdown
# One prompt for simple features

Implement [FEATURE] using Scout-Plan-Build:

1. SCOUT: Find all related files (use Task tool, haiku)
2. PLAN: Create implementation approach based on findings
3. BUILD: Implement and test

Keep me updated on progress.
```

### Maximum Control

```markdown
# Step-by-step with verification

STEP 1 - SCOUT:
[Detailed scout instructions]
STOP and show me results before proceeding.

STEP 2 - PLAN:
[Detailed planning instructions]
STOP and show me plan for approval.

STEP 3 - BUILD:
[Detailed build instructions]
Show me each file before moving to next.
```

---

## Common Mistakes to Avoid

1. **Skipping Scout for complex features** - Leads to missed dependencies
2. **Not providing enough context to Builder** - Results in inconsistent code
3. **Running parallel agents on interdependent files** - Causes conflicts
4. **Using wrong model for task** - Wastes tokens or produces poor results
5. **Not persisting agent outputs** - Loses valuable context

---

## Validation Checklist

Before considering the SDD workflow complete:

- [ ] Scout report covers all impacted areas
- [ ] Plan addresses all scout findings
- [ ] Build follows the plan (not ad-hoc changes)
- [ ] Tests pass after build
- [ ] Documentation updated if needed
- [ ] Context bundle created for future sessions

---

## Next Steps

1. **Try it**: Use the templates above on your next feature
2. **Customize**: Adapt prompts to your specific needs
3. **Iterate**: Refine based on what works for your workflow
4. **Document**: Update workflow files with your findings

The SDD framework is a methodology, not a rigid system. Use these patterns as starting points and evolve them based on your experience.
