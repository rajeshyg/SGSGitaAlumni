# SDD/TAC Framework Improvement Plan

> **Created**: November 30, 2025  
> **Last Updated**: November 30, 2025 (v2 - tool-agnostic architecture)  
> **Purpose**: Comprehensive analysis of current state, gaps, and improvement roadmap  
> **Sources**: SGSGitaAlumni Problem-Solution Report + OutreachTracker-v2 Lessons Learned + Google AI Review

---

## ⚠️ Important Compatibility Notes

### Tool/Platform Compatibility

| Feature | Claude Code CLI | VS Code + GitHub Copilot | Claude.ai Web |
|---------|-----------------|--------------------------|---------------|
| `.claude/commands/` slash commands (e.g., `/prime-*`) | ✅ Works | ❌ Not supported | ❌ Not supported |
| `.claude/skills/` auto-activation | ✅ Works | ❌ Not supported | ❌ Not supported |
| `.claude/hooks/` (PreToolUse/PostToolUse) | ✅ Works | ❌ Not supported | ❌ Not supported |
| `/context` command | ✅ Works | ❌ Not supported | ❌ Not supported |
| Manual file reading as context | ✅ Works | ✅ Works | ✅ Works |
| **CLI validation scripts** | ✅ Works | ✅ Works | ✅ Works |

**For VS Code/GitHub Copilot users**: The `/prime-*` commands won't work. Instead, manually include the content of `.claude/commands/prime-*.md` files in your prompts or use `@workspace` to reference them.

### Design Principle: Tool-Agnostic Validation

**Core logic lives in `scripts/validation/`** - runnable as CLI commands by any tool:
- Hooks (Claude Code CLI) → import/spawn validators
- Pre-commit (Husky) → call validators
- Manual (any AI tool) → run `node scripts/validation/...`

This ensures safety nets work regardless of which AI assistant is used.

### cc-sdd Package Compatibility

The `cc-sdd` npm package (v2.0.3) supports GitHub Copilot via `npx cc-sdd@latest --copilot`. However, it uses `/kiro:*` commands, not the custom `/prime-*` commands in this project. Evaluate integration before adopting.

---

## Executive Summary

This document consolidates insights from two projects implementing the SDD/TAC framework:
1. **SGSGitaAlumni** - Original implementation (current project)
2. **OutreachTracker-v2** - Second implementation with refined patterns

**Key Decisions (v2)**:
- Focus on Scout → Plan → Build → Validate workflow before orchestrator patterns
- Evolve existing `scripts/validation/rules/exceptions.cjs` instead of creating parallel constraint systems
- Split `coding-standards.md` by topic, leveraging existing `docs/lessons-learnt/` documents
- Validation logic shared between hooks and CLI (tool-agnostic)
- ESLint fixes happen per-module during feature work, not as separate framework task

---

## Part 1: Current State Assessment

### What's Already Implemented ✅

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Skills Directory | ✅ Implemented | `.claude/skills/` | 4 skills created |
| Duplication Prevention Skill | ✅ Implemented | `.claude/skills/duplication-prevention.md` | 90 lines |
| Coding Standards Skill | ✅ Implemented | `.claude/skills/coding-standards.md` | 419 lines |
| Security Rules Skill | ✅ Implemented | `.claude/skills/security-rules.md` | 211 lines |
| SDD-TAC Workflow Skill | ✅ Implemented | `.claude/skills/sdd-tac-workflow/SKILL.md` | 87 lines |
| Prime Commands | ✅ Implemented | `.claude/commands/` | 7 commands |
| Unified Prime-Framework | ✅ Implemented | `.claude/commands/prime-framework.md` | 404 lines |
| PostToolUse Hook | ✅ Implemented | `.claude/hooks/post-tool-use-validation.js` | 99 lines |
| Reduced always-on.md | ✅ Implemented | `docs/specs/context/always-on.md` | 64 lines |
| Context Bundles Pattern | ✅ Documented | `docs/context-bundles/` | Session handoff |
| Pre-commit Validation | ⚠️ Partial | `.husky/pre-commit` | Blocked by 1358 ESLint errors |

### Implementation Quality Assessment

| Skill | OutreachTracker Standard | SGSGitaAlumni Status | Gap |
|-------|--------------------------|----------------------|-----|
| `project-constraints` | Has LOCKED constraints + STOP triggers | ❌ Missing | Critical |
| `duplication-prevention` | Phase 0 mandatory, 3-step workflow | ✅ Basic | Needs STOP trigger |
| `coding-standards` | Business-agnostic (~200 lines) | ⚠️ Large (419 lines) | May have business coupling |
| `security-rules` | Business-agnostic | ✅ Good | Minor updates |
| `sdd-tac-workflow` | Phase 0 mandatory | ⚠️ Starts at Scout | Missing Phase 0 |

---

## Part 2: Problem Inventory

### 🔴 CRITICAL PROBLEMS (From Original Report - Severity 7.9/10)

| # | Problem | Original Status | Current Status | Gap Analysis |
|---|---------|-----------------|----------------|--------------|
| 1 | **Rampant Duplication (35%)** | 87+ root scripts, duplicate files | Skills created | Missing STOP trigger before file creation |
| 2 | **Repetition Nightmare (25%)** | Must repeat context each session | Skills auto-activate | ~80% auto-trigger achieved |
| 3 | **Fake Production Code (10%)** | Hardcoded UI values | ESLint rule exists | Pre-commit bypassed |
| 4 | **Overall Costs More Time** | No planning before build | Scout-Plan-Build documented | No mandatory Phase 0 |
| 5 | **Fails to Deliver Entire Solution** | Manual planning | Plan phase exists | No spec workflow (cc-sdd) |
| 6 | **Context Overload** | 144 lines always-on.md | Reduced to 64 lines | ✅ Resolved |
| 7 | **Heavy Reviewing Required** | No quality gates | Hooks + skills exist | PostToolUse only, no PreToolUse |
| 8 | **Misses Edge Cases** | No testing validation | Documented | No custom validation agent |
| 9 | **Security Blindspots** | 5 vulnerabilities found | Security skill exists | No security hook |
| 10 | **Cost Inefficiency** | Wrong model for tasks | Model guide documented | Not enforced |

### 🆕 NEW PROBLEMS (From OutreachTracker Lessons)

| # | Problem | Evidence from OutreachTracker | Risk for SGSGitaAlumni |
|---|---------|-------------------------------|------------------------|
| 11 | **Missing Phase 0 (Constraints)** | OutreachTracker added mandatory Phase 0 before Scout | Agent may violate constraints before Scout starts |
| 12 | **No LOCKED Constraints** | OutreachTracker has immutable ports, server files | Agent can accidentally modify critical configs |
| 13 | **No STOP Triggers** | OutreachTracker requires explicit approval for critical actions | Dangerous operations proceed without human check |
| 14 | **Business-Logic Coupling** | OutreachTracker separated business from technical skills | Skills may contain project-specific logic |
| 15 | **Documentation Redundancy** | OutreachTracker deleted 500+ lines of duplicates | Potential for overlapping docs in SGSGitaAlumni |
| 16 | **No PreToolUse Hook** | Only PostToolUse exists | Can't BLOCK dangerous operations, only report after |
| 17 | **Large Skill Files** | coding-standards.md is 419 lines | May exceed token budget when loaded |
| 18 | **Missing Bulk Cleanup Strategy** | OutreachTracker deleted 38 .js duplicates in one operation | Still have duplicate files needing cleanup |

### 🔮 POTENTIAL FUTURE PROBLEMS

| # | Problem | Why It's Foreseeable | Preventive Solution |
|---|---------|---------------------|---------------------|
| 19 | **Skill Auto-Activation Failure** | 80% success rate means 20% manual triggering | Add fallback triggers in always-on.md |
| 20 | **Context Budget Overflow** | 419-line skill + 404-line prime = ~6k tokens per session | Consolidate/reduce skill sizes |
| 21 | **Parallel Agent Conflicts** | Git worktrees documented but not tested | Create conflict detection mechanism |
| 22 | **Hook Performance Overhead** | PostToolUse runs on every file operation | Profile hook execution time |
| 23 | **Spec-Code Drift** | Specs may become outdated vs code | Add spec validation to pre-commit |
| 24 | **Orchestrator Agent Missing** | 10+ file features need orchestration | No orchestrator pattern implemented |

---

## Part 3: Solution Matrix

### From SDD/TAC Framework (IndyDevDan)

| Solution Pattern | Solves Problems | Implementation Status |
|------------------|-----------------|----------------------|
| **Scout Phase** | 1, 4, 8 | ✅ Documented in workflow skill |
| **Plan Phase** | 4, 5, 7 | ✅ Documented, not enforced |
| **Skills Auto-Activation** | 2, 6 | ✅ ~80% success |
| **R&D Framework** | 6, 17, 20 | ✅ Context reduced |
| **Model Selection** | 10 | ⚠️ Documented, not enforced |
| **Git Worktrees** | 21 | ⚠️ Documented, not tested |
| **PreToolUse Hooks** | 7, 9, 12, 13, 16 | ❌ Not implemented |
| **Orchestrator Pattern** | 24 | ❌ Not implemented |
| **Custom Agents** | 8, 24 | ❌ Not implemented |

### From OutreachTracker Lessons

| Solution Pattern | Solves Problems | Backport Priority |
|------------------|-----------------|-------------------|
| **Phase 0 (Constraints)** | 11, 12, 13 | 🔴 Critical |
| **LOCKED Constraints** | 12 | 🔴 Critical |
| **STOP Triggers** | 1, 13 | 🔴 Critical |
| **Business-Agnostic Skills** | 14 | 🟡 High |
| **Documentation Consolidation** | 15 | 🟡 High |
| **Bulk Cleanup Strategy** | 18 | 🟢 Medium |
| **3-Step File Creation** | 1 | 🟢 Already in skill |

### New Approaches to Consider

| Solution | Problem Addressed | Research Required |
|----------|-------------------|-------------------|
| **cc-sdd npm package** | 5 (spec workflow) | Evaluate if compatible |
| **Playwright E2E Validation** | 3, 8 | Already have Playwright |
| **ESLint Auto-Fix Pipeline** | 3, 18 | Needs prioritized approach |
| **Context Monitoring Command** | 20 | `/context` command |
| **Subagent Delegation** | 21, 24 | Task tool with subagent_type |

---

## Part 4: Gap Analysis Summary

### High-Priority Gaps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CRITICAL GAPS (Implement This Week)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MISSING: project-constraints skill with LOCKED patterns                 │
│     → Agent can accidentally modify ports, server configs                   │
│     → OutreachTracker has this as mandatory Phase 0                         │
│                                                                             │
│  2. MISSING: STOP triggers in skills                                        │
│     → Critical operations proceed without human approval                    │
│     → Needed for: deleting files, modifying auth, changing DB schema        │
│                                                                             │
│  3. MISSING: Phase 0 in workflow                                            │
│     → Current: Scout → Plan → Build                                         │
│     → Should be: Constraints → Scout → Plan → Build                         │
│                                                                             │
│  4. MISSING: PreToolUse hook for blocking                                   │
│     → Current hook (PostToolUse) only reports AFTER operation               │
│     → Need hook to BLOCK dangerous operations BEFORE they happen            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Medium-Priority Gaps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIGH-VALUE GAPS (Implement This Month)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5. LARGE: coding-standards.md is 419 lines                                 │
│     → May exceed recommended <5k token budget for skills                    │
│     → Consider splitting into focused sub-skills                            │
│                                                                             │
│  6. BLOCKED: Pre-commit validation (1358 ESLint errors)                     │
│     → Quality gates effectively disabled                                    │
│     → Dogfooding opportunity: use TAC to fix                                │
│                                                                             │
│  7. UNTESTED: Business-agnostic skill separation                            │
│     → OutreachTracker proved this works                                     │
│     → Audit skills for SGSGitaAlumni-specific terminology                   │
│                                                                             │
│  8. MISSING: Spec workflow tooling (cc-sdd or equivalent)                   │
│     → Manual spec creation/approval process                                 │
│     → Could use npm cc-sdd for structured workflow                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Research Required

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESEARCH NEEDED (Scope for Investigation)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  9. EVALUATE: cc-sdd npm package                                            │
│     → Does it integrate with existing prime commands?                       │
│     → Cost/benefit vs custom implementation                                 │
│                                                                             │
│  10. EXPERIMENT: Git worktrees for parallel agents                          │
│      → Documented but never tested in practice                              │
│      → Need to validate with 10+ file feature                               │
│                                                                             │
│  11. PROFILE: Hook execution overhead                                       │
│      → PostToolUse runs on every file operation                             │
│      → Is performance acceptable for large batches?                         │
│                                                                             │
│  12. DESIGN: Orchestrator agent pattern                                     │
│      → How to coordinate multiple parallel agents?                          │
│      → Context handoff mechanism?                                           │
│                                                                             │
│  13. MEASURE: Skill auto-activation success rate                            │
│      → Claimed ~80%, but needs validation                                   │
│      → What triggers work best?                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Improvement Roadmap

> **Architecture Decision**: All validation logic lives in `scripts/validation/rules/` as the single source of truth. Hooks and CLI commands import/call these modules. No parallel constraint systems.

### 🔴 PHASE 1: Foundation (Tool-Agnostic Validation Infrastructure)

**Goal**: Create constraint/lock system that works with any AI tool

#### 1.1 Extend Exception Registry with Lock & Constraint Rules

**File**: `scripts/validation/rules/exceptions.cjs`

**Changes**: Add new exports alongside existing `EXCEPTION_REGISTRY`:

```javascript
/**
 * LOCKED_FILES - Files requiring explicit approval before modification
 * Checked by: hooks (Claude CLI), pre-commit, manual CLI
 */
const LOCKED_FILES = {
  // Server Infrastructure
  critical: [
    { path: 'server.js', reason: 'Main entry point', approvalRequired: true },
    { path: 'config/database.js', reason: 'Database connection', approvalRequired: true },
    { pathPattern: /^\.env(\.\w+)?$/, reason: 'Environment secrets', approvalRequired: true },
  ],
  // Configuration (warn but don't block)
  sensitive: [
    { path: 'package.json', reason: 'Dependencies', warnOnly: true },
    { path: 'vite.config.js', reason: 'Build config', warnOnly: true },
    { path: 'eslint.config.js', reason: 'Lint rules', warnOnly: true },
  ],
  // Auth & Security
  security: [
    { pathPattern: /routes\/auth\.js$/, reason: 'Authentication routes', approvalRequired: true },
    { pathPattern: /middleware\/auth\.js$/, reason: 'Auth middleware', approvalRequired: true },
    { pathPattern: /routes\/otp\.js$/, reason: 'OTP routes', approvalRequired: true },
  ],
};

/**
 * STOP_TRIGGERS - Actions requiring user confirmation
 * Used by: skills (Claude), prompt context (Copilot)
 */
const STOP_TRIGGERS = [
  { action: 'create_migration', message: 'Creating new database migration - confirm schema changes' },
  { action: 'delete_file', message: 'Deleting file - confirm this is intentional' },
  { action: 'modify_api_signature', message: 'Changing API endpoint signature - may break clients' },
  { action: 'add_dependency', message: 'Adding new npm dependency - confirm necessity' },
];

/**
 * PORT_CONSTRAINTS - Immutable port assignments
 */
const PORT_CONSTRAINTS = {
  backend: 3001,
  frontend: 5173,
  // DO NOT add new ports without updating all environment configs
};

module.exports = { 
  EXCEPTION_REGISTRY, 
  IGNORED_PATHS,
  LOCKED_FILES,      // NEW
  STOP_TRIGGERS,     // NEW
  PORT_CONSTRAINTS,  // NEW
};
```

**Why This Location**: 
- Single source of truth in existing rules directory
- Already imported by validators
- Works with or without hooks

---

#### 1.2 Create Constraint Validator Module

**File**: `scripts/validation/validators/constraint-check.cjs`

**Purpose**: Validate file operations against LOCKED_FILES rules

```javascript
#!/usr/bin/env node
/**
 * CONSTRAINT VALIDATOR
 * 
 * Checks if file operations violate locked/sensitive file rules.
 * Runnable as: CLI command, hook import, pre-commit check
 * 
 * Usage:
 *   node scripts/validation/validators/constraint-check.cjs <file-path> [--block]
 *   
 * Exit codes:
 *   0 - OK (or warn-only violation)
 *   1 - Blocked (critical/security violation with --block flag)
 */

const { LOCKED_FILES } = require('../rules/exceptions.cjs');

function checkConstraints(filePath, options = {}) {
  const results = { blocked: false, warnings: [], errors: [] };
  
  for (const [category, rules] of Object.entries(LOCKED_FILES)) {
    for (const rule of rules) {
      const matches = rule.path 
        ? filePath.endsWith(rule.path)
        : rule.pathPattern?.test(filePath);
        
      if (matches) {
        const message = `[${category.toUpperCase()}] ${rule.reason}: ${filePath}`;
        
        if (rule.approvalRequired && options.block) {
          results.errors.push(message);
          results.blocked = true;
        } else if (rule.warnOnly) {
          results.warnings.push(message);
        } else {
          results.errors.push(message);
        }
      }
    }
  }
  
  return results;
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args.find(a => !a.startsWith('--'));
  const block = args.includes('--block');
  
  if (!filePath) {
    console.log('Usage: node constraint-check.cjs <file-path> [--block]');
    process.exit(0);
  }
  
  const result = checkConstraints(filePath, { block });
  
  result.warnings.forEach(w => console.warn('⚠️', w));
  result.errors.forEach(e => console.error('🛑', e));
  
  process.exit(result.blocked ? 1 : 0);
}

module.exports = { checkConstraints };
```

---

#### 1.3 Update PostToolUse Hook to Use Shared Validator

**File**: `.claude/hooks/post-tool-use-validation.js`

**Change**: Import constraint checker instead of duplicating logic

```javascript
// Add at top of existing hook:
const { checkConstraints } = require('../../scripts/validation/validators/constraint-check.cjs');

// In handleToolUse function, add after existing validation:
const constraintResult = checkConstraints(relativePath);
if (constraintResult.warnings.length > 0) {
  console.log('[Hook] ⚠️  Sensitive file modified:');
  constraintResult.warnings.forEach(w => console.log('  ' + w));
}
if (constraintResult.errors.length > 0) {
  console.log('[Hook] 🛑 LOCKED file modified (review carefully):');
  constraintResult.errors.forEach(e => console.log('  ' + e));
}
```

---

#### 1.4 Create PreToolUse Hook (Claude Code CLI Only)

**File**: `.claude/hooks/pre-tool-use-constraint.js`

**Purpose**: Block operations BEFORE they happen (Claude CLI specific)

```javascript
#!/usr/bin/env node
/**
 * PreToolUse Hook: Constraint Enforcement
 * 
 * Imports shared constraint logic from scripts/validation/
 * Exit code 2 = BLOCK the operation
 * 
 * NOTE: This hook only works in Claude Code CLI.
 * Other tools use the same logic via CLI commands.
 */

const { checkConstraints } = require('../../scripts/validation/validators/constraint-check.cjs');

// Read event from stdin
let eventData = '';
process.stdin.on('data', chunk => eventData += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(eventData);
    const result = handlePreToolUse(event);
    process.exit(result.blocked ? 2 : 0); // Exit 2 = block
  } catch (error) {
    console.error('Hook error:', error.message);
    process.exit(0); // Don't block on hook errors
  }
});

function handlePreToolUse(event) {
  const { tool_name, tool_input } = event;
  
  // Only check file-modifying tools
  if (!['Write', 'Edit', 'NotebookEdit'].includes(tool_name)) {
    return { blocked: false };
  }
  
  const filePath = tool_input?.file_path;
  if (!filePath) return { blocked: false };
  
  // Use shared constraint checker with blocking enabled
  const result = checkConstraints(filePath, { block: true });
  
  if (result.blocked) {
    console.log('\n🛑 BLOCKED: This file requires approval before modification.');
    result.errors.forEach(e => console.log('  ' + e));
    console.log('\n💡 To proceed, confirm with user first or use --force flag.\n');
  }
  
  return result;
}
```

---

### 🟡 PHASE 2: Skill & Context Improvements

**Goal**: Better organized, topic-specific skills

#### 2.1 Split `coding-standards.md` by Topic

**Current**: 524 lines (bloated)  
**Target**: Core file ~150 lines + topic-specific references

**New Structure**:

| File | Lines | Content |
|------|-------|---------|
| `.claude/skills/coding-standards.md` | ~150 | Core principles only |
| `.claude/skills/coding-standards-react.md` | ~80 | React/component patterns |
| `.claude/skills/coding-standards-backend.md` | ~80 | Node/Express patterns |
| `.claude/skills/coding-standards-database.md` | ~60 | Query patterns, transactions |

**Leverage Existing Lessons-Learnt**:

Reference these docs instead of duplicating content:

| Lessons-Learnt Doc | Topics Covered |
|-------------------|----------------|
| `posting-architecture-overhaul.md` | State management, N+1 prevention |
| `socketio-real-time-infrastructure.md` | Real-time patterns |
| `phase-8-security-vulnerabilities-resolved.md` | Security patterns |
| `shared-components-fixes.md` | Component architecture |

**Core `coding-standards.md` Structure**:
```markdown
---
name: coding-standards
description: Core coding principles. For topic-specific patterns, see sister skills.
---

# Coding Standards (Core)

## When This Applies
Any coding task in this project.

## Core Principles
1. Service files < 300 lines
2. Functions < 50 lines  
3. Complexity < 10
4. Resource cleanup with try/finally
5. No hardcoded values in UI

## Topic-Specific Skills
- React patterns → `coding-standards-react.md`
- Backend patterns → `coding-standards-backend.md`
- Database queries → `coding-standards-database.md`

## Historical Lessons
See `docs/lessons-learnt/` for detailed case studies on complex issues.
```

---

#### 2.2 Create `project-constraints` Skill

**File**: `.claude/skills/project-constraints.md`

**Note**: This skill READS from `scripts/validation/rules/exceptions.cjs` - no duplication.

```markdown
---
name: project-constraints
description: Phase 0 - Load before any coding task. References constraint rules from scripts/validation/.
---

# Project Constraints (Phase 0)

## Automatic Loading
This skill auto-activates before Scout phase.

## Constraint Source
All constraints defined in: `scripts/validation/rules/exceptions.cjs`

Run to check: `node scripts/validation/validators/constraint-check.cjs <file-path>`

## LOCKED Files (Require Approval)

Before modifying these files, STOP and ask user:

### Critical Infrastructure
- `server.js` - Main entry point
- `config/database.js` - Database connection
- `.env*` files - Environment secrets

### Security-Sensitive
- `routes/auth.js` - Authentication
- `middleware/auth.js` - Auth middleware
- `routes/otp.js` - OTP verification

## STOP Triggers

When about to perform these actions, pause and confirm:
1. Creating database migration
2. Deleting any file
3. Changing API endpoint signatures
4. Adding npm dependencies

## Port Constraints (Immutable)
- Backend API: **3001**
- Vite Dev Server: **5173**

## Phase 0 Checklist
- [ ] No LOCKED file modifications planned (or user approved)
- [ ] No STOP trigger actions (or user confirmed)
- [ ] Proceed to Scout phase
```

---

#### 2.3 Update SDD-TAC Workflow Skill with Phase 0

**File**: `.claude/skills/sdd-tac-workflow/SKILL.md`

**Add Phase 0 before Scout**:

```markdown
## Quick Assessment

### Phase 0: Load Constraints (MANDATORY)
Before ANY coding task:
1. Load `project-constraints` skill
2. Load `duplication-prevention` skill  
3. Check: Does task touch any LOCKED files?
   - YES → STOP, ask user for approval
   - NO → Proceed
4. Check: Does task trigger any STOP actions?
   - YES → Confirm with user
   - NO → Proceed

### Phase 1: Scout (Count Affected Files)
[existing content continues...]
```

---

### 🟢 PHASE 3: Validation & Quality Gates

**Goal**: Working pre-commit pipeline

#### 3.1 Register New Validator in Orchestrator

**File**: `scripts/validation/validate-structure.cjs`

**Add constraint validation to the orchestrator**:

```javascript
// Add import at top
const { checkAllConstraints } = require('./validators/constraint-check.cjs');

// Add to runAllValidators function
console.log('\n🔒 Validating constraints...');
start = Date.now();
try {
  const cv = checkAllConstraintsInChangedFiles();
  results.constraints.errors = cv.errors;
  results.constraints.warnings = cv.warnings;
} catch (err) {
  results.constraints.errors.push(`Validator error: ${err.message}`);
}
results.constraints.time = Date.now() - start;
```

---

#### 3.2 Add STOP Trigger to Duplication Prevention

**File**: `.claude/skills/duplication-prevention.md`

**Add section**:

```markdown
## STOP Trigger: File Creation

Before creating ANY new file:

1. **SEARCH**: `grep -r "similar-name" src/` or file_search tool
2. **ANALYZE**: Could existing file be extended instead?
3. **STOP**: If similar file exists, ask user:
   > "Found similar file at [path]. Options:
   > A) Extend existing file
   > B) Create new (explain why separate)
   > C) Cancel"

**Do NOT proceed until user confirms.**
```

---

### 🔵 PHASE 4: Future Enhancements (Deferred)

> These items are intentionally deferred until Phases 1-3 are stable.

#### 4.1 Orchestrator Pattern
- **When**: After Scout-Plan-Build-Validate workflow is proven
- **Prerequisite**: Git worktrees tested with 10+ file feature
- **Design**: Create `.claude/agents/orchestrator.md`

#### 4.2 Git Worktrees for Parallel Agents
- **When**: Complex features requiring 15+ files
- **Test case**: Major refactoring across api/ui/db layers

#### 4.3 cc-sdd Integration
- **When**: Current workflow feels limiting
- **Research**: Compare with existing prime commands

---

## Part 6: Success Metrics

### Framework Effectiveness

| Metric | Current (Estimate) | Target | How to Measure |
|--------|-------------------|--------|----------------|
| Skill auto-activation rate | ~80% | 95% | Fresh session tests |
| Context token usage | Unknown | <80k tokens | /context command |
| Duplication incidents | 35% of issues | <5% | Pre-commit blocks |
| Pre-commit bypass rate | 100% (forced) | 0% | ESLint error count |
| Security vulnerabilities | 5 in Phase 8 | 0 new | Security skill + hook |
| Review time per PR | High (subjective) | 50% reduction | Time tracking |

### Quality Gates

| Gate | Current Status | Target |
|------|----------------|--------|
| ESLint | Bypassed (1358 errors) | Passing |
| Mock data detection | Active | Active |
| Redundancy check | Active | Active |
| Structure validation | Active (PostToolUse) | Active (Pre + Post) |
| PreToolUse security | Not implemented | Active |

---

## Part 7: Implementation Checklist

### PHASE 1: Foundation (Tool-Agnostic Validation)

**Estimated Time**: 1-2 days

- [ ] **1.1** Extend `scripts/validation/rules/exceptions.cjs`
  - Add `LOCKED_FILES` export (critical, sensitive, security categories)
  - Add `STOP_TRIGGERS` export
  - Add `PORT_CONSTRAINTS` export
  
- [ ] **1.2** Create `scripts/validation/validators/constraint-check.cjs`
  - Implement `checkConstraints(filePath, options)` function
  - Support CLI mode with `--block` flag
  - Export for import by hooks
  
- [ ] **1.3** Update `.claude/hooks/post-tool-use-validation.js`
  - Import shared `checkConstraints` function
  - Add constraint warnings/errors to output
  
- [ ] **1.4** Create `.claude/hooks/pre-tool-use-constraint.js`
  - Use shared constraint logic
  - Exit code 2 for blocking

- [ ] **1.5** Update `.claude/settings.json`
  - Add PreToolUse hook configuration

- [ ] **1.6** Test validation CLI manually
  - `node scripts/validation/validators/constraint-check.cjs server.js --block`
  - Verify exit codes

---

### PHASE 2: Skill & Context Improvements

**Estimated Time**: 2-3 days

- [ ] **2.1** Split `coding-standards.md`
  - Create `coding-standards.md` (core ~150 lines)
  - Create `coding-standards-react.md` (~80 lines)
  - Create `coding-standards-backend.md` (~80 lines)
  - Create `coding-standards-database.md` (~60 lines)
  - Reference `docs/lessons-learnt/` documents

- [ ] **2.2** Create `project-constraints.md` skill
  - Reference `scripts/validation/rules/exceptions.cjs`
  - Include Phase 0 checklist

- [ ] **2.3** Update `sdd-tac-workflow/SKILL.md`
  - Add Phase 0: Load Constraints before Scout
  - Update decision tree

- [ ] **2.4** Add STOP trigger to `duplication-prevention.md`
  - 3-step file creation process

---

### PHASE 3: Validation & Quality Gates

**Estimated Time**: 1 day

- [ ] **3.1** Register constraint validator in orchestrator
  - Update `scripts/validation/validate-structure.cjs`
  - Add constraint check to validation pipeline

- [ ] **3.2** Test full validation pipeline
  - `node scripts/validation/validate-structure.cjs`
  - Verify constraint violations reported

- [ ] **3.3** Test pre-commit hook integration
  - Stage a LOCKED file change
  - Verify warning/block behavior

---

### PHASE 4: Future (Deferred)

> Do NOT start these until Phases 1-3 are stable and tested.

- [ ] Test Git Worktrees with 15-file feature
- [ ] Design Orchestrator pattern
- [ ] Evaluate cc-sdd integration
- [ ] Measure skill auto-activation success rate

---

## Appendix A: File Change Summary

### New Files to Create

| File | Purpose | Phase |
|------|---------|-------|
| `scripts/validation/validators/constraint-check.cjs` | Shared constraint validation | 1 |
| `.claude/hooks/pre-tool-use-constraint.js` | PreToolUse blocking hook | 1 |
| `.claude/skills/project-constraints.md` | Phase 0 constraint skill | 2 |
| `.claude/skills/coding-standards-react.md` | React patterns | 2 |
| `.claude/skills/coding-standards-backend.md` | Backend patterns | 2 |
| `.claude/skills/coding-standards-database.md` | Database patterns | 2 |

### Files to Modify

| File | Change | Phase |
|------|--------|-------|
| `scripts/validation/rules/exceptions.cjs` | Add LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS | 1 |
| `.claude/hooks/post-tool-use-validation.js` | Import shared constraint checker | 1 |
| `.claude/settings.json` | Add PreToolUse hook config | 1 |
| `.claude/skills/coding-standards.md` | Reduce to ~150 lines core | 2 |
| `.claude/skills/sdd-tac-workflow/SKILL.md` | Add Phase 0 | 2 |
| `.claude/skills/duplication-prevention.md` | Add STOP trigger | 2 |
| `scripts/validation/validate-structure.cjs` | Register constraint validator | 3 |

### Existing Docs to Reference (Not Duplicate)

| Lessons-Learnt Doc | Topics |
|-------------------|--------|
| `phase-8-security-vulnerabilities-resolved.md` | Security patterns |
| `posting-architecture-overhaul.md` | State management |
| `socketio-real-time-infrastructure.md` | Real-time patterns |
| `shared-components-fixes.md` | Component architecture |
| `posting-filter-fixes.md` | Filter implementation |
| `posting-system-fixes-and-ui-improvements.md` | UI patterns |
| `ui-improvements-summary.md` | General UI guidelines |

---

## Appendix B: Quick Reference

### Architecture: Tool-Agnostic Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                           │
│            scripts/validation/rules/exceptions.cjs                  │
│                                                                     │
│  exports: LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              scripts/validation/validators/                         │
│                 constraint-check.cjs                                │
│                                                                     │
│  - CLI: node constraint-check.cjs <file> [--block]                 │
│  - Module: checkConstraints(path, options)                          │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
   │ Claude CLI   │    │  Pre-commit  │    │ Other AI Tools   │
   │   Hooks      │    │   (Husky)    │    │  (run CLI)       │
   │              │    │              │    │                  │
   │ pre-tool-use │    │ calls via    │    │ node constraint- │
   │ post-tool-use│    │ npm script   │    │ check.cjs <file> │
   └──────────────┘    └──────────────┘    └──────────────────┘
```

### TAC Phases (Updated with Phase 0)

```
Phase 0: CONSTRAINTS (NEW - MANDATORY)
├── Load project-constraints skill
├── Load duplication-prevention skill
├── Check: LOCKED file violations? → STOP, ask user
└── Check: STOP trigger actions? → Confirm with user

Phase 1: SCOUT
├── Discover affected files
├── Find existing patterns
└── Report dependencies

Phase 2: PLAN
├── Design implementation
├── Get human approval
└── Identify parallel batches (if 10+ files)

Phase 3: BUILD
├── Execute plan
├── Follow patterns
└── Validate results

Phase 4: VALIDATE (implicit)
├── Run linting
├── Run tests
└── Check constraints
```

### Decision Tree

```
Task arrives
    │
    ▼
Phase 0: Load constraints ─────► LOCKED violation? ──► STOP, ask user
    │                                   │
    │                                   ▼ (approved)
    ▼
Count affected files
    │
    ├── 1-2 files ──────────► Build directly + Validate
    │
    ├── 3-10 files ─────────► Scout → Plan → Build → Validate
    │
    └── 10+ files ──────────► Full TAC (defer orchestrator)
```

### ESLint Fix Strategy

> ESLint fixes happen **per-module during feature work**, not as separate framework task.

When working on a module:
1. Fix module's ESLint errors as part of the feature
2. Run `npx eslint --fix` for auto-fixable issues first
3. Address remaining errors manually
4. Commit with feature changes

This keeps fixes contextual and avoids massive "fix all ESLint" PRs.

---

## Conclusion

The SDD/TAC framework in SGSGitaAlumni is **~75% complete**. The critical gaps are:

1. **No shared constraint validation** - Logic would be duplicated between hooks and CLI
2. **Phase 0 not implemented** - Agent can violate constraints before Scout
3. **No STOP triggers** - Critical operations proceed without human check
4. **Large skill files** - `coding-standards.md` at 524 lines exceeds budget

**This Plan's Approach**:
- Phase 1: Tool-agnostic validation infrastructure (works with any AI tool)
- Phase 2: Reorganized skills with topic-specific splits
- Phase 3: Quality gate integration
- Phase 4: Deferred (orchestrator, worktrees) until foundation is solid

**Next Action**: Execute Phase 1 - Extend `exceptions.cjs` with LOCKED_FILES.

