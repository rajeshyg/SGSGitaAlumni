---
version: 1.0
status: documented
last_updated: 2025-12-02
applies_to: framework
description: Agent creation, configuration, prompt engineering, and meta-agent patterns
---

# Agent Engineering: Configuration, Prompts, and Meta-Agents

---

## Overview

This document covers how to **create and configure AI agents** for the SDD/TAC framework, including:

- Agent configuration structure (`.claude/agents/`)
- Prompt engineering patterns (Input → Workflow → Output)
- Meta-agent concept (agents that build agents)
- Integration with existing skills and commands

**Prerequisite Reading**: [sub-agent-patterns.md](./sub-agent-patterns.md) for context management

---

## Core Concepts

### Agent Information Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    AGENT INTERACTION LOOP                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User Prompt ──► Primary Agent                            │
│                          │                                   │
│  2. Primary Agent ──► Delegates to Sub-Agent                 │
│                          │                                   │
│  3. Sub-Agent ──► Executes in ISOLATED context               │
│                          │                                   │
│  4. Sub-Agent ──► Reports back to Primary Agent              │
│                          │                                   │
│  5. Primary Agent ──► Responds to User                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> **Critical Insight**: Sub-agents do NOT talk to users. They report to the Primary Agent. All prompts should instruct "report back to primary agent" not "tell the user."

### Agent vs Skill vs Command

| Concept | Location | Purpose | Context |
|---------|----------|---------|---------|
| **Agent** | `.claude/agents/` | Autonomous task execution | Fresh, isolated window |
| **Skill** | `.claude/skills/` | Auto-activated expertise | Same context, triggered |
| **Command** | `.claude/commands/` | On-demand context loading | Same context, manual |

---

## Agent Configuration Structure

### Directory Layout

```
.claude/
├── agents/
│   ├── meta-agent.json         # Agent that creates other agents
│   ├── scout-agent.json        # Domain-specific reconnaissance
│   ├── qa-agent.json           # Quality assurance
│   ├── docs-agent.json         # Documentation generation
│   └── summary-agent.json      # Session summary/reporting
├── skills/                     # Existing skills
├── commands/                   # Existing commands
└── settings.json               # Hook configuration
```

### Agent Configuration Schema

```json
{
  "name": "scout-agent",
  "description": "Use this agent when you need to discover existing patterns, files, or architecture in a specific domain (auth, database, API, UI). Proactively call this agent for any task affecting 3+ files.",
  "tools": ["read_file", "grep_search", "semantic_search", "list_dir"],
  "color": "blue",
  "systemPrompt": "You are a reconnaissance specialist. Your job is to discover existing code patterns and report findings to the Primary Agent.\n\n## Input\n- Domain to scout (auth, database, API, UI)\n- Specific questions to answer\n\n## Workflow\n1. Search for relevant files using grep_search\n2. Read key files to understand patterns\n3. Document existing conventions\n4. Identify dependencies and integrations\n\n## Output\nReport to the Primary Agent with:\n- Files discovered (with line counts)\n- Patterns identified (with examples)\n- Dependencies mapped\n- Recommendations for implementation"
}
```

### Configuration Fields

| Field | Purpose | Best Practice |
|-------|---------|---------------|
| `name` | Unique identifier | kebab-case, descriptive |
| `description` | **CRITICAL**: When to call this agent | Be explicit: "Use when...", "Proactively call for..." |
| `tools` | Whitelist of allowed tools | Limit for security (e.g., read-only agent) |
| `color` | Terminal output distinction | Visual debugging aid |
| `systemPrompt` | Agent behavior rules | Use Input/Workflow/Output structure |

---

## Prompt Engineering Patterns

### Level 1: Ad-Hoc Prompt (Simple Tasks)

```
Create a function that validates email format.
```

### Level 2: Workflow Prompt (Multi-Step Tasks)

```markdown
## Purpose
Create email validation utility with comprehensive rules.

## Workflow
1. Check `src/utils/` for existing validation utilities
2. Create `email-validator.ts` with:
   - RFC 5322 compliant regex
   - Domain validation
   - Common typo detection
3. Add unit tests in `src/utils/__tests__/`
4. Export from `src/utils/index.ts`

## Report
- Files created/modified
- Test coverage
- Edge cases handled
```

### Level 3: Control Flow Prompt (Conditional Logic)

```markdown
## Purpose
Add validation to posting creation with conditional rules.

## Workflow
1. Read `src/schemas/posting.ts` for existing schema
2. IF schema uses Zod:
   - Extend existing schema with new fields
   ELSE IF schema uses Yup:
   - Create equivalent Yup validation
   ELSE:
   - STOP: Report unknown schema library
3. Add validation for:
   - Title (5-200 chars)
   - Content (10-5000 chars)
   - Expiry date (future only)
4. IF `src/components/PostingForm.tsx` exists:
   - Integrate validation with form
   ELSE:
   - Create validation hook only

## Report
- Schema library found
- Changes made
- Integration status
```

### Level 4: Delegation Prompt (Sub-Agent Orchestration)

```markdown
## Purpose
Implement new notification system across frontend and backend.

## Workflow
1. DELEGATE to scout-agent:
   - Prompt: "Scout notification patterns in backend routes and frontend components"
   - Wait for findings
2. Based on scout report, create implementation plan
3. DELEGATE to parallel agents:
   - Agent 1: Backend notification routes
   - Agent 2: Frontend notification components
   - Agent 3: Database schema changes
4. Aggregate results
5. DELEGATE to qa-agent:
   - Prompt: "Verify notification system integration"

## Report
- Scout findings summary
- Implementation completed per agent
- QA results
- Integration issues (if any)
```

---

## Meta-Agent Concept

The **Meta-Agent** creates other agents based on requirements.

### Meta-Agent Configuration

```json
{
  "name": "meta-agent",
  "description": "Use this agent when you need to create a new specialized agent. Provide the problem to solve, not the technology to use.",
  "tools": ["read_file", "create_file", "list_dir"],
  "systemPrompt": "You are an agent architect. You create specialized agents following the project's agent patterns.\n\n## Input\n- Problem to solve (NOT technology)\n- Required capabilities\n- Security constraints\n\n## Workflow\n1. Read existing agents in .claude/agents/\n2. Read project patterns from docs/specs/technical/development-framework/agent-engineering.md\n3. Design agent configuration:\n   - Descriptive name\n   - Clear description (CRITICAL: when to call)\n   - Minimal tool permissions\n   - Input/Workflow/Output system prompt\n4. Create agent file in .claude/agents/\n\n## Output\nReport to Primary Agent:\n- Agent file created\n- Description summary\n- Tools granted\n- Usage example"
}
```

### Meta-Agent Usage Pattern

```
❌ WRONG: "I want to use 11Labs, what can I build?"
✅ RIGHT: "I lose track of long builds. I need audio notification when complete."

Problem → Solution → Technology
```

---

## Common Pitfalls

### Pitfall 1: Writing User-Facing Prompts

```
❌ WRONG (in systemPrompt):
"Hey user, I found these files for you!"

✅ RIGHT (in systemPrompt):
"Report to the Primary Agent with a concise summary of discovered files."
```

### Pitfall 2: Overlapping Descriptions

If multiple agents have similar descriptions, the Primary Agent gets confused about which to call.

```
❌ WRONG:
Agent A: "Use for code quality"
Agent B: "Use for checking code"

✅ RIGHT:
Agent A: "Use for static analysis (ESLint, TypeScript errors)"
Agent B: "Use for runtime testing (unit tests, integration tests)"
```

### Pitfall 3: Too Many Tools

```
❌ WRONG:
"tools": ["*"]  // Full access

✅ RIGHT:
"tools": ["read_file", "grep_search"]  // Read-only scout
```

---

## Integration with Existing Infrastructure

### Skills vs Agents Decision

| Scenario | Use |
|----------|-----|
| Same context, auto-triggered | **Skill** |
| Isolated context, complex task | **Agent** |
| Parallel execution needed | **Agent** |
| Security-isolated operation | **Agent** (limited tools) |

### Agent-Skill Interaction

Agents CAN use skills by:
1. Reading skill content as context
2. Following skill patterns in their work

```markdown
## systemPrompt (agent)
Before implementing, read and follow patterns from:
- .claude/skills/coding-standards.md
- .claude/skills/security-rules.md
```

### Agent-Command Integration

Commands can invoke agents:

```markdown
# /prime-feature (command)

## Workflow
1. Load feature context
2. DELEGATE to scout-agent for reconnaissance
3. Return findings for planning
```

---

## Agent Templates

### Read-Only Scout Agent

```json
{
  "name": "scout-[domain]",
  "description": "Scout [domain] patterns. Use before any [domain] implementation.",
  "tools": ["read_file", "grep_search", "list_dir"],
  "systemPrompt": "## Purpose\nDiscover existing [domain] patterns.\n\n## Workflow\n1. Search for [domain] files\n2. Read key implementations\n3. Document patterns\n\n## Output\n- Files: (list with sizes)\n- Patterns: (with code examples)\n- Recommendations: (for implementation)"
}
```

### QA Agent

```json
{
  "name": "qa-agent",
  "description": "Run quality checks after implementation. Use after any feature build.",
  "tools": ["run_in_terminal", "read_file", "grep_search"],
  "systemPrompt": "## Purpose\nVerify implementation quality.\n\n## Workflow\n1. Run: npm run lint (file)\n2. Run: npm run test:run (related tests)\n3. Check for anti-patterns (god objects, N+1)\n4. Verify documentation updated\n\n## Output\n- Lint: PASS/FAIL (count)\n- Tests: PASS/FAIL (coverage)\n- Anti-patterns: CLEAN/FOUND (list)\n- Docs: UPDATED/MISSING"
}
```

---

## Implementation Roadmap

| Phase | Task | Status |
|-------|------|--------|
| 1 | Create `.claude/agents/` directory | 🔴 TODO |
| 2 | Implement meta-agent | 🔴 TODO |
| 3 | Implement scout-agent (auth, db, api, ui) | 🔴 TODO |
| 4 | Implement qa-agent | 🔴 TODO |
| 5 | Document agent usage in skills | 🔴 TODO |
| 6 | Test orchestration with 10+ file feature | 🔴 TODO |

---

## References

- **Sub-Agent Patterns**: [sub-agent-patterns.md](./sub-agent-patterns.md)
- **IndyDevDan TAC Concepts**: `docs/archive/root-docs/IndyDevDan_TAC/`
- **Agentic Prompt Engineering**: `docs/archive/root-docs/IndyDevDan_TAC/Agentic Prompt Engineering.txt`
- **Existing Skills**: `.claude/skills/`
- **Existing Commands**: `.claude/commands/`
