---
version: 2.0
status: active
last_updated: 2025-12-05
applies_to: framework
description: Hub-and-spoke agent architecture, model selection, and orchestration patterns
supersedes: archive/2025-12-05-agent-engineering-v1.md
---

# Agent Engineering: Hub-and-Spoke Architecture

---

## Overview

This document defines the **hub-and-spoke** agent architecture for the SDD/TAC framework.

**Key Principle**: Sub-agents NEVER talk to each other. The Primary Agent (Orchestrator) mediates ALL communication.

**Reference**: `docs/context-bundles/2025-12-05-agent-architecture-research.md`

---

## Hub-and-Spoke Architecture

### The Model

```
                    ┌─────────────────────────────────────┐
                    │                                     │
        ┌───────────▼───────────┐                        │
        │      USER PROMPT      │                        │
        └───────────┬───────────┘                        │
                    │                                     │
                    ▼                                     │
        ┌───────────────────────┐                        │
        │   PRIMARY AGENT       │◄───────────────────────┘
        │   (Orchestrator)      │
        │      OPUS MODEL       │
        │                       │
        │  • Receives user task │
        │  • Delegates to subs  │
        │  • Aggregates results │
        │  • Reports to user    │
        └───────────┬───────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│  SCOUT  │   │ BUILDER │   │VALIDATOR│
│ (Haiku) │   │(Sonnet) │   │ (Haiku) │
│         │   │         │   │         │
│ Reports │   │ Reports │   │ Reports │
│   TO    │   │   TO    │   │   TO    │
│ Primary │   │ Primary │   │ Primary │
└────┬────┘   └────┬────┘   └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
                    │
            ALL REPORT BACK
            TO PRIMARY ONLY
```

### Communication Rules

| Component | Talks To | NEVER Talks To |
|-----------|----------|----------------|
| User | Primary Agent only | Sub-agents directly |
| Primary Agent | User, All Sub-agents | N/A (it's the hub) |
| Scout | Primary Agent only | Builder, Validator, User |
| Builder | Primary Agent only | Scout, Validator, User |
| Validator | Primary Agent only | Scout, Builder, User |

### Why Hub-and-Spoke?

| ❌ Wrong (Direct Communication) | ✅ Correct (Hub-and-Spoke) |
|--------------------------------|---------------------------|
| Scout → Builder → Validator → User | Scout → Primary → Builder → Primary → Validator → Primary → User |
| Context polluted at each handoff | Each agent has isolated context |
| Harder to debug | Clear audit trail |
| Agents accumulate irrelevant context | Primary synthesizes and filters |

---

## Agent Definitions

### Pre-defined Agents (Always Available)

| Agent | Model | Cost | Purpose | Location |
|-------|-------|------|---------|----------|
| **Orchestrator** | Opus | ~$15/1M | Coordination, decision-making | `.claude/agents/orchestrator.md` |
| **Scout** | Haiku | ~$0.25/1M | Fast discovery, pattern matching | `.claude/agents/scout.md` |
| **Builder** | Sonnet | ~$3/1M | Code implementation | `.claude/agents/builder.md` |
| **Validator** | Haiku | ~$0.25/1M | Quality checks | `.claude/agents/validator.md` |

### Dynamic Agents (Spawned On-Demand)

| Agent | Model | Purpose | When Spawned |
|-------|-------|---------|--------------|
| SchemaScout | Haiku | Database exploration | DB-heavy tasks |
| ComponentScout | Haiku | UI pattern discovery | UI-heavy tasks |
| TestWriter | Sonnet | Test generation | When tests needed |
| Refactorer | Sonnet | Code restructuring | Refactoring tasks |
| DocWriter | Haiku | Documentation | Doc-specific tasks |

---

## Model Selection Strategy

### The Golden Rule

```
Orchestrator (complex decisions)  → OPUS
Information retrieval, discovery  → HAIKU
Design decisions, implementation  → SONNET
```

### Model Assignment Matrix

| Agent Role | Model | Cost | Reasoning |
|------------|-------|------|-----------|
| **Orchestrator/Primary** | **Opus** | ~$15/1M tokens | Complex coordination, decision-making, synthesis |
| Scout | Haiku | ~$0.25/1M tokens | Fast discovery, pattern matching, no deep reasoning |
| Builder | Sonnet | ~$3/1M tokens | Code generation, implementation logic |
| Validator | Haiku | ~$0.25/1M tokens | Structured validation, checklist verification |

### Why Opus for Orchestrator?

The Orchestrator needs to:
1. Understand complex user requests
2. Break down into sub-tasks intelligently
3. Decide which agent to spawn
4. Synthesize results from multiple agents
5. Make judgment calls on quality

This requires **Opus-level reasoning**, not Sonnet.

### Cost Comparison

| Approach | Scout | Plan | Build | Total |
|----------|-------|------|-------|-------|
| All-Sonnet | $2.00 | $1.50 | $3.00 | **$6.50** |
| Optimized Stack | $0.20 (Haiku) | $1.50 | $3.00 | **$4.70** (28% savings) |

---

## Agent Configuration Schema

### Directory Layout

```
.claude/
├── agents/
│   ├── orchestrator.md    # Primary agent (Opus)
│   ├── scout.md           # Discovery agent (Haiku)
│   ├── builder.md         # Implementation agent (Sonnet)
│   └── validator.md       # Quality agent (Haiku)
├── skills/                # Behavioral rules (existing)
├── commands/              # On-demand context (existing)
└── settings.json          # Hook configuration
```

### Agent Definition Template

```markdown
---
name: agent-name
model: haiku|sonnet|opus
description: When to invoke this agent
tools: [list of allowed tools]
---

# Agent Name

## Purpose
What this agent does.

## Input
What it receives from the Primary Agent:
- Task description
- Context summary (NOT raw files)
- Specific questions to answer

## Workflow
1. Step one
2. Step two
3. Step three

## Output
Report to the Primary Agent with:
- Summary of findings
- Files discovered/modified
- Recommendations
- Blockers (if any)

## Rules
- NEVER address the user directly
- Always report back to Primary Agent
- Stay within tool permissions
```

---

## Interaction Loop

### Complete Flow

```
1. USER PROMPT
   └── User sends request to Primary Agent

2. PRIMARY AGENT (Orchestrator)
   ├── Parse complexity (file count, domains)
   ├── Check Phase 0 constraints
   └── Decide: Single agent or multiple?

3. DELEGATION (if needed)
   ├── Spawn Scout Agent → wait for summary
   ├── Synthesize findings
   ├── Spawn Builder Agent → wait for completion
   └── Spawn Validator Agent → wait for report

4. AGGREGATION
   └── Primary Agent combines all reports

5. USER RESPONSE
   └── Primary Agent responds to User
```

### Critical Insight

> **When writing prompts for Sub Agents, you are NOT talking to the user; you are instructing the Sub Agent on how to report back to the Primary Agent.**

```markdown
❌ WRONG (in sub-agent prompt):
"Hey user, I found these files for you!"

✅ CORRECT (in sub-agent prompt):
"Report to the Primary Agent with a concise summary of discovered files."
```

---

## Prompt Engineering Patterns

### Level 1: Simple Task (No Sub-Agents)

```
Create a function that validates email format.
```
→ Primary Agent handles directly

### Level 2: Discovery Task (Scout Agent)

```
User Request: "Add filtering to alumni API"

Primary Agent spawns Scout with:
---
## Task
Scout the alumni API domain for existing patterns.

## Questions
1. What route handles alumni listing?
2. Are there existing filter implementations?
3. What query parameters are supported?

## Output
Report back with:
- Files found (with line numbers)
- Existing patterns (with code examples)
- Recommended approach
---
```

### Level 3: Implementation Task (Scout → Builder)

```
1. Primary → Scout: "Discover auth patterns"
   Scout → Primary: "Found JWT in middleware/auth.js, patterns X, Y, Z"

2. Primary analyzes findings, creates plan

3. Primary → Builder: "Implement feature per plan"
   Builder → Primary: "Created files A, B, C with coverage"

4. Primary → Validator: "Verify implementation"
   Validator → Primary: "Tests pass, no anti-patterns"

5. Primary → User: "Feature complete, summary..."
```

---

## Agent vs Skill vs Command

| Concept | Location | Purpose | Context |
|---------|----------|---------|---------|
| **Agent** | `.claude/agents/` | Autonomous task execution | **Fresh, isolated window** |
| **Skill** | `.claude/skills/` | Auto-activated expertise | Same context, triggered |
| **Command** | `.claude/commands/` | On-demand context loading | Same context, manual |

### When to Use Each

| Scenario | Use |
|----------|-----|
| Same context, auto-triggered by keyword | **Skill** |
| On-demand context loading | **Command** |
| Isolated context, complex task | **Agent** |
| Parallel execution needed | **Agent** |
| Security-isolated operation | **Agent** (limited tools) |

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Architecture research | ✅ Complete | Hub-and-spoke defined |
| Model selection guide | ✅ Documented | Opus/Sonnet/Haiku |
| `.claude/agents/` directory | 🔴 TODO | Create directory |
| Orchestrator definition | 🔴 TODO | `.claude/agents/orchestrator.md` |
| Scout definition | 🔴 TODO | `.claude/agents/scout.md` |
| Builder definition | 🔴 TODO | `.claude/agents/builder.md` |
| Validator definition | 🔴 TODO | `.claude/agents/validator.md` |
| Handoff protocol | 🔴 TODO | Sub-agent → Primary format |
| Dynamic agent spawning | ⏸️ DEFERRED | Phase 4 |

---

## SDK vs Task Tool Decision

### Recommendation: Use Task Tool + Configuration

| Approach | Portability | Maintenance | Recommended? |
|----------|-------------|-------------|--------------|
| Task tool + markdown | ✅ High | ✅ Low | **YES** |
| Custom SDK | ❌ Low | ❌ High | NO |

### Why NOT Custom SDK

- Tightly coupled to specific LLM
- High rewrite cost when switching tools
- Agent definitions in markdown are portable
- Task tool provides sub-agent spawning natively

### What IS Portable

| Layer | Portability |
|-------|-------------|
| Agent definitions (markdown) | ✅ High - role descriptions work across LLMs |
| Prompt engineering (skills) | ✅ High - works with minor adjustments |
| Orchestration patterns | ✅ High - Scout → Build is universal |
| Task tool invocation | 🟡 Medium - API changes, pattern stays |
| Custom SDK code | ❌ Low - requires rewrite |

---

## References

- **Architecture Research**: `docs/context-bundles/2025-12-05-agent-architecture-research.md`
- **Model Selection Guide**: [model-selection.md](./model-selection.md)
- **Archived Version**: `archive/2025-12-05-agent-engineering-v1.md`
- **IndyDevDan TAC Documentation**: `docs/archive/root-docs/IndyDevDan_TAC/`
