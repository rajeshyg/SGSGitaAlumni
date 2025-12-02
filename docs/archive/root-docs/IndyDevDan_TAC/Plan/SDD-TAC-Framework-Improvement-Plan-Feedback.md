# SDD/TAC Framework Alignment Analysis: Preventing Agent Architectural Violations

Your implementation captures the core TAC philosophy but lacks the **critical constraint enforcement layer** that prevents "agent goes rogue" scenarios. The most urgent gap is the absence of **Phase 0 (Constraints)** with PreToolUse blocking hooks—your agent can currently execute destructive operations before any validation occurs. This analysis provides actionable implementation patterns to close these gaps.

## Gap analysis reveals 7 critical alignment issues

| Component | IndyDevDan Framework | Your Implementation | Gap Severity |
|-----------|---------------------|---------------------|--------------|
| **Phase 0 (Constraints)** | Mandatory constraint check before Scout | Missing entirely | 🔴 Critical |
| **PreToolUse Hooks** | Exit code 2 blocks operations before execution | Not implemented | 🔴 Critical |
| **LOCKED_FILES** | Deterministic file protection via hooks | Documented but not enforced | 🔴 Critical |
| **STOP_TRIGGERS** | Human confirmation for destructive ops | Documented but not enforced | 🔴 Critical |
| **R&D Framework** | Reduce context + Delegate to sub-agents | context-management.md exists | 🟡 Partial |
| **Skill File Size** | Progressive disclosure, ~50-100 lines per SKILL.md | 419+ lines in coding-standards.md | 🟡 Needs refactor |
| **Scout-Plan-Build** | Spec-first, reconnaissance mandatory | sdd-framework.md documents it | 🟢 Aligned |
| **Model Selection** | Haiku for discovery, Sonnet for build | Not documented | 🟡 Missing |

The critical finding: your framework **documents** safety constraints but lacks **deterministic enforcement**. IndyDevDan's approach treats constraints as code that executes via hooks, not guidelines Claude might choose to follow.

## Phase 0 implementation stops agent drift before it starts

Your "disaster session" occurred because the agent skipped directly to implementation. IndyDevDan's implicit workflow requires **mandatory constraint validation** before any Scout activity. Here's the missing Phase 0 integration:

```markdown
## CLAUDE.md - Phase 0: Constraint Enforcement (ADD THIS)

### BEFORE ANY TASK (Non-Negotiable)

**Step 0.1 - Boundary Check**
- Confirm working directory: `pwd`
- Verify project scope: Only files in `$CLAUDE_PROJECT_DIR`
- Check LOCKED_FILES list (see below)

**Step 0.2 - Port/Infrastructure Audit**
- Run: `docker ps` for running containers
- Run: `grep -r ":300" . --include="*.yml" --include="*.json"`
- Consult ports.config.json for assignments

**Step 0.3 - Existing Implementation Search**
- Search for related functionality: `grep -r "[feature-keyword]" .`
- Review relevant README sections
- If duplicates found: STOP and report

**ONLY AFTER Phase 0 passes → proceed to Scout**
```

This phase executes deterministically via PreToolUse hooks. The agent cannot bypass it because the hook runs before any tool invocation.

## PreToolUse hooks with exit code 2 create the missing enforcement layer

The fundamental gap in your implementation is the absence of **blocking hooks**. PostToolUse can only report after damage occurs. PreToolUse with exit code 2 prevents the action entirely and feeds the error message directly to Claude.

### Complete `.claude/settings.json` configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/enforce-locked-files.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash-command.sh"
          }
        ]
      },
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/enforce-project-boundary.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-lint.sh"
          }
        ]
      }
    ]
  },
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Edit(./docker-compose.yml)",
      "Write(./ports.config.json)"
    ]
  }
}
```

### Hook script: `.claude/hooks/enforce-locked-files.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Read JSON from stdin
json=$(cat)
file=$(echo "$json" | jq -r '.tool_input.path // .tool_input.file_path // ""')

# LOCKED_FILES - exit 2 blocks and feeds message to Claude
LOCKED_FILES=(
  "docker-compose.yml"
  "ports.config.json"
  ".env"
  ".env.production"
  "scripts/deploy.sh"
  "infrastructure/terraform/*.tf"
  "package-lock.json"
)

for locked in "${LOCKED_FILES[@]}"; do
  if [[ "$file" == *"$locked"* ]] || printf '%s\n' "$file" | grep -Eq "^${locked//\*/.*}$"; then
    echo "🔒 LOCKED FILE: '$file' requires human approval before modification." >&2
    echo "Action: Explain your proposed change and wait for explicit 'proceed' confirmation." >&2
    exit 2  # Blocks operation, message sent to Claude
  fi
done

exit 0
```

### Hook script: `.claude/hooks/validate-bash-command.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

cmd=$(jq -r '.tool_input.command // ""')

# STOP_TRIGGERS - operations requiring human confirmation
STOP_TRIGGERS=(
  'rm\s+-rf'
  'git\s+push'
  'git\s+reset\s+--hard'
  'DROP\s+TABLE'
  ':3002'           # Your reserved port
  'npm\s+install'
  'yarn\s+add'
  'chmod\s+777'
  'sudo\b'
)

for trigger in "${STOP_TRIGGERS[@]}"; do
  if echo "$cmd" | grep -Eiq "$trigger"; then
    echo "⚠️ STOP TRIGGER: Command matches '$trigger'" >&2
    echo "This operation requires human confirmation. Explain why this is necessary." >&2
    exit 2
  fi
done

exit 0
```

### Hook script: `.claude/hooks/enforce-project-boundary.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

file=$(jq -r '.tool_input.path // .tool_input.file_path // ""')

# Block path traversal attempts
if [[ "$file" == *".."* ]]; then
  echo "🚫 BOUNDARY VIOLATION: Path traversal detected ('$file')" >&2
  echo "Access to parent directories is blocked. Work only within project scope." >&2
  exit 2
fi

# Block absolute paths outside project
if [[ "$file" == /* ]] && [[ "$file" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "🚫 BOUNDARY VIOLATION: File '$file' is outside project directory" >&2
  echo "You may only access files within: $CLAUDE_PROJECT_DIR" >&2
  exit 2
fi

exit 0
```

## Your skill files need refactoring for reliable auto-activation

Your **coding-standards.md at 419+ lines exceeds the recommended limit** by 4x. Research shows Claude can follow ~150-200 instructions with reasonable consistency, and your Claude Code system prompt already contains ~50 instructions. Large skill files cause instruction-following degradation.

### Recommended skill organization pattern

```
.claude/skills/
├── coding-standards/
│   ├── SKILL.md              # 50-100 lines - core rules only
│   └── resources/
│       ├── typescript.md     # Deep-dive: TS patterns
│       ├── testing.md        # Deep-dive: Test patterns
│       └── naming.md         # Deep-dive: Conventions
├── duplication-prevention/
│   ├── SKILL.md
│   └── resources/
│       └── checklist.md
└── security-enforcement/
    ├── SKILL.md
    └── resources/
        └── owasp-rules.md
```

### SKILL.md template with progressive disclosure

```yaml
---
name: coding-standards
description: TypeScript/React coding standards for this project. Use when writing 
             or reviewing code in src/**/*.ts or src/**/*.tsx files.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Coding Standards

## Core Rules (Always Apply)
1. TypeScript strict mode - no `any` types
2. React functional components with hooks
3. Tests required for business logic

## When to Load Resources
- For TypeScript patterns: Read `resources/typescript.md`
- For testing patterns: Read `resources/testing.md`
- For naming conventions: Read `resources/naming.md`

## Quick Reference
[Keep this section under 30 lines with most critical patterns]
```

This pattern enables **progressive disclosure**: metadata loads at startup (~10 tokens), core SKILL.md loads when triggered (~100 tokens), and resource files load on-demand only when needed.

## Tool-agnostic vs Claude-CLI-specific recommendations

Your requirement for tool-agnostic patterns is important. Here's the separation:

### Tool-agnostic patterns (work in any AI coding tool)

These belong in markdown files that any tool can read:

```markdown
## CLAUDE.md / AGENTS.md - Tool-Agnostic Constraints

### LOCKED FILES (Require Human Approval)
| File | Reason |
|------|--------|
| docker-compose.yml | Port mappings are immutable |
| ports.config.json | Canonical port registry |
| .env.production | Production secrets |
| scripts/*.sh | Verified deployment scripts |

### STOP TRIGGERS (Require Confirmation)
| Operation | Action |
|-----------|--------|
| Any file deletion | STOP → explain → wait for approval |
| Port configuration | STOP → check conflicts → wait |
| npm install / yarn add | STOP → security review needed |
| git push | STOP → human verification required |

### PROJECT BOUNDARIES
- Root: This directory only
- External references: FORBIDDEN without explicit approval
- Port 3002: RESERVED - never create services on this port
```

### Claude-CLI-specific patterns (require Claude Code)

These use Claude Code's hook system and settings.json:

| Feature | Implementation | Location |
|---------|---------------|----------|
| PreToolUse blocking | Shell scripts with exit 2 | `.claude/hooks/*.sh` |
| File deny rules | Native permissions | `.claude/settings.json` |
| Custom commands | Slash commands | `.claude/commands/*.md` |
| Hook configuration | JSON config | `.claude/settings.json` |
| Model switching | `/model` command | In-session |

For **maximum portability**, implement constraints at both layers: markdown files for AI interpretation + hooks for deterministic enforcement.

## Context bundles enable 70% session restoration

IndyDevDan's R&D Framework emphasizes context preservation. Here's the recommended structure:

```
.claude/context/
├── SESSION_NOTES.md          # Current task state
├── plan.md                   # Active implementation plan
└── reconnaissance/
    └── [feature]-recon.md    # Scout phase findings
```

### SESSION_NOTES.md template

```markdown
# Session Context - 2025-12-02

## Current Task
Implementing user authentication flow

## Progress
- [x] Scout: Reviewed existing auth patterns
- [x] Plan: Created spec in specs/auth-flow.md  
- [ ] Build: Implementing JWT middleware

## Key Decisions
- Using jose library (already in package.json)
- Token refresh: 15-minute access, 7-day refresh

## Files Modified This Session
- src/middleware/auth.ts: New JWT validation
- src/routes/auth.ts: Login/logout endpoints

## Next Steps
1. Complete refresh token rotation
2. Add rate limiting
3. Write integration tests

## Context for Next Session
Run: `claude --continue` to resume
Key file: specs/auth-flow.md has full implementation plan
```

### Session continuity commands

```bash
claude --continue              # Resume most recent
claude --resume               # Interactive session picker
/compact                      # At 70% context, compress with focus
/clear                        # Fresh start, loads CLAUDE.md
```

## Prioritized implementation roadmap

### Tier 1: Critical (Implement Immediately)

| Item | Action | Impact |
|------|--------|--------|
| **PreToolUse hooks** | Create `.claude/hooks/` with blocking scripts | Prevents destructive operations |
| **settings.json** | Add hook configuration + deny rules | Enables deterministic enforcement |
| **Phase 0 section** | Add constraint check section to CLAUDE.md | Forces reconnaissance before action |
| **Port registry** | Create `ports.config.json` with LOCKED status | Prevents duplicate infrastructure |

### Tier 2: High Priority (This Week)

| Item | Action | Impact |
|------|--------|--------|
| **Refactor coding-standards.md** | Split into SKILL.md + resources/ | Improves instruction-following |
| **Custom /scout command** | Create `.claude/commands/scout.md` | Enforces reconnaissance workflow |
| **Context bundle structure** | Create `.claude/context/` templates | Enables session restoration |
| **Boundary check hook** | Add project boundary enforcement | Prevents external file access |

### Tier 3: Incremental Improvements

| Item | Action | Impact |
|------|--------|--------|
| **Model selection docs** | Document Haiku/Sonnet switching strategy | Optimizes cost/speed |
| **Git worktrees setup** | Add parallel execution documentation | Enables multi-agent workflows |
| **Auto-activation rules** | Create `skill-rules.json` with file triggers | Improves skill activation reliability |
| **PostToolUse quality gates** | Add lint/format hooks | Catches issues after edits |

## Preventing your specific disaster scenario

Your session failure had four root causes. Here are the deterministic fixes:

**Problem 1: Duplicate infrastructure (two servers on port 3002)**
```bash
# .claude/hooks/validate-bash-command.sh - add this check
if echo "$cmd" | grep -Eq ":(3001|3002|3003|5432)"; then
  echo "⚠️ RESERVED PORT DETECTED in command" >&2
  echo "Check ports.config.json before using any port. These are locked: 3001, 3002, 3003, 5432" >&2
  exit 2
fi
```

**Problem 2: Referenced external projects**
```bash
# .claude/hooks/enforce-project-boundary.sh already handles this
# Also add to CLAUDE.md:
## FORBIDDEN
- ❌ import from '../other-project'
- ❌ Copy code from external repositories
- ❌ Reference patterns from other projects without approval
```

**Problem 3: Removed critical scripts**
```bash
# Add to LOCKED_FILES in enforce-locked-files.sh
LOCKED_FILES+=(
  "scripts/*.sh"
  "bin/*"
)
```

**Problem 4: Skipped reconnaissance**
```markdown
## .claude/commands/scout.md - Mandatory reconnaissance command

Before implementing $ARGUMENTS, perform:

1. **Existing Implementation Search**
   - `grep -r "$ARGUMENTS" . --include="*.ts" --include="*.tsx"`
   - `find . -name "*$ARGUMENTS*" -type f`

2. **Infrastructure Audit**  
   - `cat docker-compose.yml`
   - `docker ps`
   - `cat ports.config.json`

3. **Document Findings**
   - Create `specs/recon-$ARGUMENTS.md`
   - List all related files found
   - Note potential conflicts

4. **STOP** - Present findings, do NOT proceed without approval
```

## Conclusion: Your framework needs enforcement, not more documentation

The fundamental insight from this analysis: **IndyDevDan's approach treats constraints as executable code, not suggestions**. Your current implementation documents the right patterns but relies on Claude choosing to follow them. The solution is adding a deterministic enforcement layer via PreToolUse hooks that physically cannot be bypassed.

The three highest-impact changes:
1. **Add `.claude/hooks/` directory** with blocking scripts using exit code 2
2. **Configure `.claude/settings.json`** with hook registrations and deny rules  
3. **Add Phase 0 constraint checking** to CLAUDE.md as mandatory pre-Scout step

These changes transform your framework from "guidelines the agent might follow" to "constraints the agent cannot violate"—which is the core principle behind IndyDevDan's agentic coding philosophy of building systems that build systems safely.