---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Reduce and Delegate framework for managing AI context efficiently
---

# Context Management (R&D Framework)

## Overview

**Problem**: Context pollution leads to slow responses, expensive tokens, and degraded quality.

**Solution**: R&D Framework (Reduce & Delegate) keeps context lean and efficient.

**Source**: [TAC Framework Report](../../../archive/root-docs/IndyDanDev_TAC/TAC_FRAMEWORK_REPORT_IMPROVED.md)

---

## The R&D Framework

### R = REDUCE (Minimize Static Context)

**Principle**: Only load what's immediately needed

**Implementation**:
```
always-on.md          → ≤50 lines (~100 tokens)
Skills (scan)         → ~100 tokens per skill
Skills (activated)    → <5k tokens when loaded
Prime commands        → ~1500 tokens when invoked
Total budget          → <80% of 200k token limit
```

**Rules**:
1. **always-on.md**: Essential only (tech stack, critical rules)
2. **Skills**: Auto-activate based on context (progressive disclosure)
3. **Prime commands**: On-demand loading (not preloaded)
4. **MCP tools**: Delete preloaded servers from `.claude.json`

**Monitor with**:
```bash
/context  # Check current token usage
```

### D = DELEGATE (Offload to Sub-Agents)

**Principle**: Heavy tasks run in separate context windows

**Implementation**:
```
Main Agent          → Lightweight orchestration
├─ Scout Agent      → Runs in separate context, summarizes back
├─ Planner Agent    → Separate context, returns plan
└─ Build Agents     → Multiple separate contexts, parallel execution
```

**Benefits**:
- Main agent context stays clean
- Sub-agents have full 200k budget
- Results summarized back (compress 10k → 1k)
- True parallelism with git worktrees

**Use Task tool**:
```markdown
Use Task tool with subagent_type=Explore for discovery
Use Task tool with subagent_type=Plan for planning
```

---

## Context Persistence Stack

### Layer 1: Always-On Context (≤50 lines)

**File**: `docs/specs/context/always-on.md`

**Contents**:
- Tech stack essentials
- Critical security rules
- Project conventions

**Current Size**: 44 lines (~100 tokens) ✅

**Example**:
```markdown
# Critical Rules
- SQL: Parameterized queries only [?, ?]
- DB: Always use try/finally for connection.release()
- Validation: Check all input before DB operations
- Logging: Never log passwords, JWT secrets, OTP codes, tokens
```

### Layer 2: Skills (Auto-Activate)

**Location**: `.claude/skills/`

**How It Works**:
1. Claude scans all skills (~100 tokens per skill)
2. Matches description to current task
3. Loads relevant skill content (<5k tokens)
4. Other skills remain inactive

**Installed Skills**:
- `sdd-tac-workflow` - Scout-Plan-Build methodology
- `duplication-prevention` - Before creating files
- `security-rules` - Auth/database/API code
- `coding-standards` - Service/database quality

**Token Cost**:
- Scan: ~400 tokens (4 skills × 100)
- Loaded: <5k tokens (only when triggered)

### Layer 3: Prime Commands (On-Demand)

**Location**: `.claude/commands/`

**How It Works**:
User invokes `/prime-framework` → loads ~1500 tokens

**Available Commands**:
- `/prime-framework` - Full SDD/TAC methodology
- `/prime-auth` - Authentication domain context
- `/prime-api` - API development context
- `/prime-database` - Database operations context
- `/prime-ui` - UI/theme development context

**Token Cost**: ~1500 tokens per command (only when invoked)

### Layer 4: Context Bundles (Session Continuity)

**Location**: `docs/context-bundles/[date]-[feature].md`

**Purpose**: Preserve session state for next session

**Token Savings**: 10k tokens (full conversation) → 1k tokens (bundle) = **90% reduction**

**Format**:
```markdown
# Context Bundle: [Feature Name]
**Date**: 2025-11-26
**Session Duration**: 2 hours

## What Was Accomplished
- Implemented user authentication
- Created OTP verification

## Files Modified
- routes/auth.js - Added login endpoint
- middleware/auth.js - Added token verification

## Architectural Decisions
1. Used JWT for session tokens (7-day expiry)
2. OTP stored in database with 5-minute TTL

## Next Steps
- [ ] Add rate limiting to OTP endpoints
- [ ] Implement refresh token rotation

## Blockers
- Need clarification on password reset flow

## Key Code References
- Login logic: routes/auth.js:45
- Token verification: middleware/auth.js:23
```

**Usage Next Session**:
```markdown
"Read context bundle from 2025-11-26 to restore session"
```

**Restoration Rate**: ~70% of context with 90% token savings

---

## Context Budget Management

### Total Budget

```
Claude Code: 200k tokens
Target:      <80% usage (<160k tokens)
Reserve:     40k tokens for responses
```

### Breakdown by Source

```
Always-On:        100 tokens    (0.05%)
Skills (scan):    400 tokens    (0.2%)
Skills (loaded):  5,000 tokens  (2.5%)
Prime commands:   1,500 tokens  (0.75%)
Codebase read:    20,000 tokens (10%)
Working context:  130,000 tokens (65%)
────────────────────────────────────
Total:           ~157,000 tokens (78.5%) ✅
```

### Context Monitoring

**Check regularly**:
```bash
/context  # Shows current token usage
```

**If approaching 80%**:
1. Stop loading more context
2. Delegate tasks to sub-agents
3. Create context bundle and restart session

### Context Cleanup

**When to clean up**:
- Token usage > 80%
- Response time slowing
- Quality degrading

**How to clean up**:
1. Create context bundle (see Layer 4 above)
2. Start fresh session
3. Load context bundle (1k tokens vs 10k+ for full history)

---

## Delegation Patterns

### Pattern 1: Scout Delegation

**Problem**: Discovering 50+ files pollutes main context

**Solution**: Delegate to Scout agent
```bash
# Main agent stays clean
Use Task tool:
  subagent_type: Explore
  model: haiku
  prompt: "Scout the authentication system"

# Scout runs in separate context (200k tokens available)
# Returns summarized findings (~1k tokens)
```

**Benefit**: Main context stays at ~5k, Scout uses separate 200k budget

### Pattern 2: Parallel Build Delegation

**Problem**: Building 15 files sequentially takes too long

**Solution**: Parallel agents with git worktrees
```bash
# Main agent orchestrates
git worktree add ../project-auth feature/auth
git worktree add ../project-api feature/api
git worktree add ../project-ui feature/ui

# Spawn parallel agents (each with separate context)
Agent 1 (auth):  Files 1-5  in worktree 1
Agent 2 (api):   Files 6-10 in worktree 2
Agent 3 (ui):    Files 11-15 in worktree 3

# Each agent has full 200k tokens
# No context pollution between agents
# Main agent merges when complete
```

**See**: [agent-orchestration.md](./agent-orchestration.md) for details

### Pattern 3: Research Delegation

**Problem**: Researching external docs/APIs consumes context

**Solution**: Delegate to research agent
```bash
Use Task tool:
  subagent_type: general-purpose
  prompt: "Research React Query patterns and summarize best practices"

# Research agent:
# - Uses full 200k tokens for deep research
# - Returns summarized findings (~2k tokens)
```

**Benefit**: Main agent gets distilled knowledge without context pollution

---

## Best Practices

### DO
- ✅ Keep always-on.md under 50 lines
- ✅ Use skills for domain knowledge (auto-activate)
- ✅ Use prime commands for on-demand loading
- ✅ Delegate heavy research to sub-agents
- ✅ Create context bundles at session end
- ✅ Monitor token usage with `/context`
- ✅ Use git worktrees for true parallelism

### DON'T
- ❌ Preload all MCP tools in `.claude.json`
- ❌ Put everything in always-on.md
- ❌ Load all prime commands at once
- ❌ Run heavy tasks in main agent context
- ❌ Ignore token usage warnings
- ❌ Try to fit 100k token conversation in one session

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Bloated Always-On
```markdown
# ❌ BAD: 200-line always-on.md
- Full tech stack documentation
- All API endpoints listed
- Complete database schema
- All coding standards
- Security requirements
- Testing guidelines
```

**Solution**: Move to skills/prime commands, keep only essentials

### Anti-Pattern 2: Preloaded MCP Tools
```json
// ❌ BAD: .claude.json with all tools loaded
{
  "mcpServers": {
    "filesystem": { "preload": true },
    "database": { "preload": true },
    "api": { "preload": true }
  }
}
```

**Solution**: Load tools on-demand, not at startup

### Anti-Pattern 3: Monolithic Build
```markdown
# ❌ BAD: One agent builds all 20 files
Agent reads all 20 files → 50k tokens
Agent plans all changes → 10k tokens
Agent implements all 20 → context exhausted
```

**Solution**: Parallel agents, 3-5 files each, separate contexts

---

## Context Budget Calculator

### Estimate Your Context Usage

```python
# Always-on
always_on_tokens = 100

# Skills (4 skills)
skills_scan_tokens = 4 * 100 = 400
skills_loaded_tokens = 5000  # When activated

# Prime command (if loaded)
prime_tokens = 1500

# Files read (estimate)
files_count = 10
avg_file_size = 200  # lines
tokens_per_line = 1.5
files_tokens = files_count * avg_file_size * tokens_per_line = 3000

# Conversation history
messages_count = 20
avg_message_tokens = 200
conversation_tokens = messages_count * avg_message_tokens = 4000

# Total
total_tokens = always_on_tokens + skills_scan_tokens + skills_loaded_tokens + prime_tokens + files_tokens + conversation_tokens
total_tokens = 100 + 400 + 5000 + 1500 + 3000 + 4000 = 14,000 tokens

# Percentage of budget
percentage = (total_tokens / 200000) * 100 = 7%
```

**Target**: Keep under 80% (160k tokens)

---

## Troubleshooting

### Problem: Responses getting slow
**Diagnosis**: Token usage likely > 80%
**Solution**:
1. Check `/context`
2. Create context bundle
3. Restart session with bundle

### Problem: AI forgetting earlier conversation
**Diagnosis**: Context window full
**Solution**:
1. Summarize conversation so far
2. Create context bundle
3. Start fresh session

### Problem: Quality degrading
**Diagnosis**: Too much noise in context
**Solution**:
1. Review what's loaded (skills, commands)
2. Delegate tasks to sub-agents
3. Clean up unnecessary context

---

## Related Specs

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Uses R&D framework throughout
- [Model Selection Guide](./model-selection-guide.md) - Cost optimization complements context optimization
- [Agent Orchestration](./agent-orchestration.md) - Delegation patterns for parallel work

---

**Summary**: Reduce static context to essentials, delegate heavy work to sub-agents. Target <80% token usage.
