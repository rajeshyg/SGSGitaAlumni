# SDD/TAC Framework Improvement Plan

> **Created**: November 30, 2025  
> **Last Updated**: November 30, 2025 (accuracy corrections)  
> **Purpose**: Comprehensive analysis of current state, gaps, and improvement roadmap  
> **Sources**: SGSGitaAlumni Problem-Solution Report + OutreachTracker-v2 Lessons Learned

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

**For VS Code/GitHub Copilot users**: The `/prime-*` commands won't work. Instead, manually include the content of `.claude/commands/prime-*.md` files in your prompts or use `@workspace` to reference them.

### cc-sdd Package Compatibility

The `cc-sdd` npm package (v2.0.3) supports GitHub Copilot via `npx cc-sdd@latest --copilot`. However, it uses `/kiro:*` commands, not the custom `/prime-*` commands in this project. Evaluate integration before adopting.

---

## Executive Summary

This document consolidates insights from two projects implementing the SDD/TAC framework:
1. **SGSGitaAlumni** - Original implementation (current project)
2. **OutreachTracker-v2** - Second implementation with refined patterns

Key finding: OutreachTracker-v2 evolved the framework with **Phase 0 (Constraints)**, **LOCKED patterns**, and **business-agnostic skills**. These improvements should be backported to SGSGitaAlumni.

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
| Reduced always-on.md | ✅ Implemented | `docs/specs/context/always-on.md` | 46 lines |
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
| 6 | **Context Overload** | 144 lines always-on.md | Reduced to 46 lines | ✅ Resolved |
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

### 🔴 TIER 1: Critical (This Week) - Backport from OutreachTracker

#### 1.1 Create `project-constraints` Skill

**File**: `.claude/skills/project-constraints/SKILL.md`

**Content Structure**:
```markdown
---
name: project-constraints
description: MANDATORY Phase 0 skill. Auto-invoke BEFORE any coding task. Contains LOCKED constraints and STOP triggers that cannot be overridden.
---

# Project Constraints (Phase 0 - Mandatory)

## LOCKED Constraints (Immutable)

### Server Configuration
- **Port 3001**: Backend API (DO NOT change)
- **Port 5173**: Vite dev server (DO NOT change)
- **server.js**: Main entry point (STOP before modifying)

### Database
- **MySQL**: Primary database (DO NOT switch databases)
- **config/database.js**: Connection config (STOP before modifying)

### Critical Files (Require STOP Trigger)
- `.env` files
- `package.json` (dependencies section)
- Authentication routes
- Database migrations

## STOP Triggers

When about to perform these actions, STOP and ask user:
1. Creating new database table
2. Modifying authentication logic
3. Deleting any file
4. Changing API endpoint signatures
5. Modifying environment configuration

## Phase 0 Checklist

Before proceeding to Scout phase:
- [ ] Verified no LOCKED violations in planned changes
- [ ] Identified any STOP trigger actions
- [ ] Confirmed with user if STOP triggers apply
```

**Why Critical**: Prevents accidental damage to critical infrastructure.

---

#### 1.2 Add Phase 0 to Workflow Skill

**File**: `.claude/skills/sdd-tac-workflow/SKILL.md`

**Changes**:
```markdown
## Quick Assessment

### Step 0: Load Constraints (MANDATORY)
Before ANY coding task:
1. Load `project-constraints` skill
2. Load `duplication-prevention` skill  
3. Verify planned changes don't violate LOCKED constraints
4. Identify any STOP triggers in scope

### Step 1: Count Affected Files
[existing content]
```

---

#### 1.3 Add STOP Trigger to Duplication Prevention

**File**: `.claude/skills/duplication-prevention.md`

**Add Section**:
```markdown
## STOP Trigger: File Creation

Before creating ANY new file, you MUST:

1. **SEARCH**: Use grep/glob to find similar files
2. **ANALYZE**: Review if existing file can be extended
3. **STOP**: If similar file exists, ask user:
   > "Found similar file at [path]. Should I:
   > A) Extend existing file
   > B) Create new file anyway (explain why)
   > C) Cancel operation"

**Do NOT proceed with file creation until user confirms.**
```

---

#### 1.4 Create PreToolUse Hook

**File**: `.claude/hooks/pre-tool-use-security.js`

**Purpose**: Block dangerous operations BEFORE they happen

```javascript
#!/usr/bin/env node
/**
 * PreToolUse Hook: Security and Constraint Validation
 * 
 * Blocks dangerous operations before Claude executes them.
 * Exit code 2 = BLOCK the operation
 */

const blockedPatterns = [
  // Dangerous file operations
  { pattern: /rm\s+.*-[rf]/, reason: 'Recursive delete blocked' },
  { pattern: /DROP\s+TABLE/i, reason: 'DROP TABLE blocked' },
  { pattern: /TRUNCATE/i, reason: 'TRUNCATE blocked' },
  
  // LOCKED files
  { pattern: /server\.js$/, reason: 'LOCKED: server.js requires approval' },
  { pattern: /\.env/, reason: 'LOCKED: .env files require approval' },
  { pattern: /database\.js$/, reason: 'LOCKED: database config requires approval' },
];

// Implementation to read stdin, check patterns, exit(2) to block
```

**Configuration** (`.claude/settings.json`):
```json
{
  "PreToolUse": [
    {
      "matcher": { "tools": ["Bash", "Write", "Edit"] },
      "hooks": [
        { "type": "command", "command": "node .claude/hooks/pre-tool-use-security.js" }
      ]
    }
  ]
}
```

---

### 🟡 TIER 2: High Value (This Month)

#### 2.1 Reduce `coding-standards.md` Size

**Current**: 419 lines
**Target**: ~200 lines (business-agnostic core)

**Strategy**:
1. Extract SGSGitaAlumni-specific patterns to project docs
2. Keep only universal TypeScript/React/Node patterns
3. Move examples to separate reference file

---

#### 2.2 Fix ESLint Errors Using TAC

**Apply Scout-Plan-Build**:

```
Phase 0: Check constraints (no LOCKED violations expected)

Phase 1 (Scout - Haiku):
  - Categorize 1358 errors by auto-fixable vs manual
  - Group by file clusters
  - Identify priority (security > functionality > style)

Phase 2 (Plan - Sonnet):
  - Batch 1: Auto-fixable (run `npx eslint --fix`)
  - Batch 2: Quick manual (unused vars, missing types)
  - Batch 3: Complex (refactoring needed)

Phase 3 (Build - Parallel if 10+ files):
  - Execute batches sequentially
  - Run validation after each batch
```

---

#### 2.3 Audit Skills for Business Coupling

**Check each skill for SGSGitaAlumni-specific terminology**:

| Skill | Check For | Action |
|-------|-----------|--------|
| coding-standards.md | "Alumni", "Posting", "Chat" | Extract to functional specs |
| security-rules.md | "OTP", specific routes | Keep security patterns, move route refs |
| duplication-prevention.md | Specific folder paths | OK - paths are structural |

---

#### 2.4 Evaluate cc-sdd Integration

**Research Tasks**:
1. Install: `npx cc-sdd@latest --claude`
2. Test with simple feature spec
3. Document integration points with existing prime commands
4. Decide: adopt, adapt, or skip

---

### 🟢 TIER 3: Incremental (Ongoing)

#### 3.1 Test Skill Auto-Activation

**Experiment Design**:
1. Start fresh Claude session
2. Request: "Implement user profile editing feature"
3. Observe which skills auto-activate
4. Document trigger success/failure
5. Refine skill descriptions based on results

---

#### 3.2 Test Git Worktrees Pattern

**Experiment Design**:
1. Create 15-file feature spec
2. Set up 3 git worktrees (api, ui, db)
3. Run parallel agents
4. Document merge process and conflicts
5. Create playbook for future use

---

#### 3.3 Implement Orchestrator Pattern

**Research Requirements**:
- Review IndyDevDan's orchestrator videos
- Design context handoff mechanism
- Define conflict detection rules
- Create `.claude/agents/orchestrator.md`

---

#### 3.4 Add Context Monitoring

**Implementation**:
```markdown
## Context Budget Monitoring

Use `/context` command to check token usage:
- Target: <80% of 200k limit
- Warning: >60% suggests context pollution
- Action: If high, run context cleanup
```

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

### Week 1 (Critical)

- [ ] Create `.claude/skills/project-constraints/SKILL.md`
- [ ] Update `sdd-tac-workflow` to include Phase 0
- [ ] Add STOP trigger to `duplication-prevention.md`
- [ ] Create `.claude/hooks/pre-tool-use-security.js`
- [ ] Update `.claude/settings.json` with PreToolUse configuration
- [ ] Test Phase 0 workflow in fresh session

### Week 2-4 (High Value)

- [ ] Reduce `coding-standards.md` to ~200 lines
- [ ] Scout ESLint errors with Haiku
- [ ] Create ESLint fix plan
- [ ] Execute ESLint fix batches
- [ ] Audit skills for business coupling
- [ ] Evaluate cc-sdd npm package

### Ongoing (Incremental)

- [ ] Test skill auto-activation (3 sessions)
- [ ] Test git worktrees with 15-file feature
- [ ] Design orchestrator pattern
- [ ] Document context monitoring process
- [ ] Measure success metrics monthly

---

## Appendix A: File Change Summary

### New Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `.claude/skills/project-constraints/SKILL.md` | LOCKED constraints + STOP triggers | 🔴 Critical |
| `.claude/hooks/pre-tool-use-security.js` | Block dangerous operations | 🔴 Critical |

### Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `.claude/skills/sdd-tac-workflow/SKILL.md` | Add Phase 0 | 🔴 Critical |
| `.claude/skills/duplication-prevention.md` | Add STOP trigger | 🔴 Critical |
| `.claude/settings.json` | Add PreToolUse hook config | 🔴 Critical |
| `.claude/skills/coding-standards.md` | Reduce to ~200 lines | 🟡 High |

### Files to Audit

| File | Check For | Action |
|------|-----------|--------|
| All skills | Business-specific terminology | Extract to specs |
| `docs/` | Duplicate/overlapping content | Consolidate |

---

## Appendix B: Quick Reference

### TAC Phases (Updated)

```
Phase 0: CONSTRAINTS (NEW)
├── Load project-constraints skill
├── Load duplication-prevention skill
├── Check for LOCKED violations
└── Identify STOP triggers

Phase 1: SCOUT
├── Discover affected files
├── Find existing patterns
└── Report dependencies

Phase 2: PLAN
├── Design implementation
├── Get human approval
└── Identify parallel batches

Phase 3: BUILD
├── Execute plan
├── Follow patterns
└── Validate results
```

### Decision Tree

```
Task arrives
    │
    ▼
Load Phase 0 constraints ──────► LOCKED violation? ──► STOP, ask user
    │
    ▼
Count affected files
    │
    ├── 1-2 files ──────────► Build directly
    │
    ├── 3-10 files ─────────► Scout → Plan → Build
    │
    └── 10+ files ──────────► Full TAC with parallel agents
```

---

## Conclusion

The SDD/TAC framework in SGSGitaAlumni is **~75% complete**. The critical gaps are:

1. **Phase 0 not implemented** - Agent can violate constraints before Scout
2. **No STOP triggers** - Critical operations proceed without human check
3. **No PreToolUse hook** - Can only report problems, not prevent them
4. **Pre-commit bypassed** - Quality gates effectively disabled

Backporting the Phase 0 pattern from OutreachTracker-v2 will close these gaps and bring the framework to **~90% effectiveness**.

**Recommended Next Action**: Create `project-constraints` skill with LOCKED patterns and STOP triggers.
