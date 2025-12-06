# Agent Architecture Research: IndyDevDan TAC Pattern Analysis
**Date**: 2025-12-05  
**Purpose**: Deep research on sub-agent communication, SDK strategy, and model selection  
**Status**: Ready for Roadmap Enhancement  
**Supersedes**: `2025-12-03-agent-phases-strategy-review.md` (keeps that document for historical reference)

---

## Executive Summary

After analyzing IndyDevDan's TAC documentation, this research addresses three strategic questions:

| Question | Finding | Action |
|----------|---------|--------|
| **1. SDK Overhead/Portability** | Use Task tool + config, NOT custom SDK | ✅ Patterns portable across LLMs |
| **2. Agent Inventory** | Hub-and-spoke model: Primary mediates ALL | ✅ Pre-defined + dynamic agents |
| **3. Current Agent Behavior** | Have skills, NOT agents | 🔴 Gap - need orchestration layer |

**Key Architectural Correction**: Sub-agents NEVER talk to each other. The Primary/Orchestrator agent is ALWAYS the mediator between user and sub-agents AND between sub-agents themselves.

---

## Research Finding 1: SDK Strategy - NOT Over-Engineering

### The Question
> Is building an SDK over-engineering when you might switch from Claude Code to GitHub Copilot or Gemini CLI?

### Evidence from IndyDevDan
From `Claude Code SDK Custom Agents.txt`:
> "The evolution of agentic engineering follows a definitive path: **Better Agents → More Agents → Custom Agents**."

However, the SDK is recommended only for **advanced use cases**:
- Multi-agent orchestration with custom UI
- Websocket streaming for real-time feedback
- Production deployments with custom observability

**For YOUR use case** (development framework, not production system), use:
1. **Task tool** - Native Claude Code sub-agent spawning
2. **Markdown agent definitions** - `.claude/agents/*.md`
3. **Configuration** - `.claude/settings.json`

### Portability Assessment

| Layer | Portability | Notes |
|-------|-------------|-------|
| **Agent Definitions** (markdown) | ✅ High | Role descriptions translate to any LLM |
| **Prompt Engineering** (skills) | ✅ High | Works across LLMs with minor adjustments |
| **Orchestration Patterns** | ✅ High | Scout → Build universal concept |
| **Task Tool Invocation** | 🟡 Medium | API changes, but pattern stays |
| **Custom SDK Code** | ❌ Low | Tightly coupled, high rewrite cost |

### Recommendation
```
✅ DO: Agent definitions + Task tool + Configuration
❌ DON'T: Custom SDK code that requires maintenance
```

**Verdict**: NOT over-engineering IF you stay at the configuration layer. The work IS portable because you're defining **patterns and behaviors**, not **implementation code**.

---

## Research Finding 2: Agent Communication Model (CRITICAL CORRECTION)

### The Question
> Don't we need different agents that can communicate with each other?

### IndyDevDan's Explicit Answer: **NO**

From `Agents.txt` (Sub Agents documentation):
> "A fundamental misunderstanding of Sub Agents lies in their communication pathway. **They do not interact directly with the user.**"

### The Hub-and-Spoke Model

```
                    ┌─────────────────────────────────────┐
                    │                                     │
        ┌───────────▼───────────┐                        │
        │      USER PROMPT      │                        │
        └───────────┬───────────┘                        │
                    │                                     │
                    ▼                                     │
        ┌───────────────────────┐                        │
        │    PRIMARY AGENT      │◄───────────────────────┘
        │    (Opus/Sonnet)      │
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

### Critical Quotes from IndyDevDan

**From `Agents.txt`:**
> "The Interaction Loop:
> 1. User Prompt: The user sends a command/prompt to the **Primary Agent** (Claude Code).
> 2. Delegation: Based on the prompt, the Primary Agent identifies and calls the appropriate **Sub Agent**.
> 3. Execution: The Sub Agent performs the work in an **isolated context window**.
> 4. Reporting: The Sub Agent reports its results back to the **Primary Agent**.
> 5. Final Response: The Primary Agent synthesizes the Sub Agent's report and responds to the **User**."

> **"Crucial Insight:** When writing prompts for Sub Agents, you are not talking to the user; you are instructing the Sub Agent on how to report back to the Primary Agent."

**From `Multi-Agent Orchestration with the Orchestrator Agent.txt`:**
> "The O-Agent serves as the central nervous system for a fleet of AI agents. Instead of an engineer manually prompting individual agents for separate tasks, they interact with a single Orchestrator Agent."

> "The Orchestrator creates, commands, and coordinates other agents **but does not perform the low-level coding work itself**. This protects its context window."

### What This Means for Your Architecture

**WRONG (Sub-agents talking to each other):**
```
Scout ──► Builder ──► Validator ──► User
         ↓
    (Context polluted at each handoff)
```

**CORRECT (Primary Agent as hub):**
```
User ◄──► Primary Agent ◄──► Scout
               ▲
               ├──────────► Builder
               │
               └──────────► Validator

(Primary aggregates, sub-agents have isolated context)
```

### Architectural Implication

| Component | Talks To | Never Talks To |
|-----------|----------|----------------|
| User | Primary Agent only | Sub-agents |
| Primary Agent | User, All Sub-agents | N/A (hub) |
| Scout | Primary Agent | Builder, Validator, User |
| Builder | Primary Agent | Scout, Validator, User |
| Validator | Primary Agent | Scout, Builder, User |

---

## Research Finding 3: Model Selection Strategy

### The Question
> What model should the orchestrator use? What about sub-agents?

### IndyDevDan's Explicit Guidance

From `Introduction to Claude Haiku 4.5 and Sonnet 4.5.txt`:

> "The video emphasizes the importance of having a **'model stack'** (e.g., weak, base, strong: Haiku, Sonnet, Opus) to strategically choose the right model for the right task."

### Model Assignment Matrix

| Agent Role | Model | Cost | Reasoning |
|------------|-------|------|-----------|
| **Orchestrator/Primary** | **Opus** | ~$15/1M tokens | Complex coordination, decision-making, synthesis |
| Scout | Haiku | ~$0.25/1M tokens | Fast discovery, pattern matching, no deep reasoning |
| Builder | Sonnet | ~$3/1M tokens | Code generation, implementation logic |
| Validator | Haiku | ~$0.25/1M tokens | Structured validation, checklist verification |
| Dynamic/Specialized | Haiku or Sonnet | Varies | Task-dependent |

### Evidence for Opus as Orchestrator

From the documentation:
> "Haiku is not a good planner for deep thinking or complex tasks"

> "Sonnet is for: Big, heavy-hitting items, Planning, Architecture design"

> "Model Stacks: weak, base, strong: Haiku, Sonnet, **Opus**"

**Logic**: The Orchestrator needs to:
1. Understand complex user requests
2. Break down into sub-tasks intelligently
3. Decide which agent to spawn
4. Synthesize results from multiple agents
5. Make judgment calls on quality

This requires **Opus-level reasoning**, not Sonnet.

### Corrected Model Configuration

```json
{
  "agents": {
    "orchestrator": { 
      "model": "opus",
      "maxTokens": 8000,
      "role": "Coordination, synthesis, decision-making"
    },
    "scout": { 
      "model": "haiku", 
      "maxTokens": 4000,
      "role": "Fast discovery, pattern matching"
    },
    "builder": { 
      "model": "sonnet", 
      "maxTokens": 16000,
      "role": "Code generation, implementation"
    },
    "validator": { 
      "model": "haiku", 
      "maxTokens": 4000,
      "role": "Structured validation"
    }
  }
}
```

---

## Research Finding 4: Agent Inventory - Pre-defined + Dynamic

### The Question
> Are 3 agents (Orchestrator, Scout, Builder) sufficient?

### Answer: Pre-defined Core + Dynamic Spawning

**From `Multi-Agent Orchestration with the Orchestrator Agent.txt`:**
> "Agent CRUD (Scalability): To manage agents at scale, the system implements **CRUD** (Create, Read, Update, Delete) operations for agents. **Dynamic Scaling**: Agents are spun up dynamically to handle specific tasks and deleted immediately upon completion."

> "Disposable Agents: Agents should be treated as temporary workers. They are spun up for a single purpose and deleted immediately upon completion."

### Recommended Agent Inventory

**Pre-defined (Always Available):**

| Agent | Model | Purpose | Why Pre-defined |
|-------|-------|---------|-----------------|
| **Orchestrator** | Opus | Central coordination | Core of the system |
| **Scout** | Haiku | General discovery | Used in 80%+ of tasks |
| **Builder** | Sonnet | Code implementation | Used in 80%+ of tasks |
| **Validator** | Haiku | Quality checks | Used post-build always |

**Dynamic (Spawned On-Demand):**

| Agent | Model | Purpose | When Spawned |
|-------|-------|---------|--------------|
| SchemaScout | Haiku | Database exploration | DB-heavy tasks |
| ComponentScout | Haiku | UI pattern discovery | UI-heavy tasks |
| TestWriter | Sonnet | Test generation | When tests needed |
| Refactorer | Sonnet | Code restructuring | Refactoring tasks |
| DocWriter | Haiku | Documentation | Doc-specific tasks |

### Dynamic Agent Creation Flow

```
User Request: "Add alumni search feature"
       │
       ▼
┌─────────────────────────────────────────┐
│         ORCHESTRATOR (Opus)              │
│                                         │
│  1. Analyze request complexity          │
│  2. Determine required agents           │
│  3. Check: Do pre-defined agents fit?   │
│     YES → Use Scout + Builder           │
│     NO → Spawn specialized agent        │
│  4. Delegate tasks with isolated context│
│  5. Aggregate results                   │
│  6. Delete temporary agents             │
│  7. Report to user                      │
└─────────────────────────────────────────┘
```

---

## Research Finding 5: Parallel Execution - DEFER

### The Question
> Should we implement git worktrees for parallel execution?

### Answer: **DEFER** until core agent architecture is proven

**From `2025-12-03-agent-phases-strategy-review.md`:**
> "You haven't tested Scout-Plan-Build on 3-10 file features extensively. Most features are likely <10 files."

### Complexity vs. Value Analysis

| Feature | Complexity | Prerequisites | Value |
|---------|------------|---------------|-------|
| Hub-and-spoke agents | Medium | Skills + Task tool | High |
| Model selection | Low | Configuration only | High |
| Git worktrees | High | Working agent system | Medium |
| Parallel execution | Very High | Worktrees + orchestration | Medium |

### Implementation Order

```
Phase A: Agent Architecture (THIS RESEARCH)
         ├── Hub-and-spoke model
         ├── Model selection strategy
         └── Pre-defined + dynamic agents

Phase B: Sequential Validation
         ├── Test with 3-5 file features
         ├── Validate context isolation
         └── Measure token reduction

Phase C: THEN (if needed)
         ├── Git worktrees
         └── Parallel execution
```

---

## Current State Assessment

### What Exists

| Component | Status | Evidence |
|-----------|--------|----------|
| Skills (behavioral rules) | ✅ Implemented | Multiple `.md` files in `.claude/skills/` |
| MCP Tools | ✅ Implemented | `mcp-tools/` directory |
| PreToolUse/PostToolUse Hooks | ✅ Implemented | `.claude/hooks/` |
| Agent definitions | 🟡 Partial | `.claude/agents/` exists but incomplete |
| Orchestrator pattern | ❌ Not Implemented | Roadmap shows as TODO |
| Model selection | ❌ Not Implemented | Not in current configuration |
| Sub-agent isolation | ❌ Not Implemented | Currently all in primary context |

### Gap Analysis

| Need | Current | Required | Gap |
|------|---------|----------|-----|
| Context isolation | Monolithic | Hub-and-spoke | 🔴 Architectural |
| Model optimization | Single model | Opus/Sonnet/Haiku stack | 🔴 Configuration |
| Agent mediation | N/A | Primary as hub | 🔴 Not implemented |
| Dynamic agents | N/A | CRUD operations | 🟡 Future phase |

---

## Revised Phase Plan

### Phase 2: Behavioral Fixes (CURRENT - IN PROGRESS)
- [x] Mandate AskUserQuestion tool in skills
- [ ] Re-run Tests 1, 2, 4
- [ ] Expected: 75% pass rate

### Phase 2.5: Model Selection Configuration (NEW)
- [ ] Add model configuration schema to `.claude/settings.json`
- [ ] Document model selection criteria
- [ ] Configuration only - no code changes
- [ ] Expected: Foundation for cost optimization

### Phase 3: Hub-and-Spoke Agent Architecture (ELEVATED)
**Previously "Scout Agent Isolation" - now fuller scope**

- [ ] Create `.claude/agents/orchestrator.md` (Opus)
- [ ] Create `.claude/agents/scout.md` (Haiku)
- [ ] Create `.claude/agents/builder.md` (Sonnet)
- [ ] Create `.claude/agents/validator.md` (Haiku)
- [ ] Implement Task tool invocation patterns
- [ ] Document handoff protocols (sub-agents → primary only)
- [ ] Expected: Context isolation, 37x token reduction on discovery

### Phase 4: Dynamic Agent Spawning (AFTER PHASE 3 VALIDATED)
- [ ] Add CRUD operations for agents
- [ ] Create on-demand agent templates
- [ ] Implement agent lifecycle (create → use → delete)
- [ ] Expected: Flexible handling of specialized tasks

### Phase 5: Parallel Execution (DEFERRED)
**Prerequisites**: Phases 2-4 validated on 10+ real tasks

- [ ] Git worktree documentation
- [ ] Parallel task distribution
- [ ] Branch merging strategies
- [ ] Expected: 3-5x build time improvement (large features only)

---

## Key Corrections to Previous Analysis

| Item | Previous (Incorrect) | Corrected |
|------|---------------------|-----------|
| **Agent communication** | Sub-agents could talk to each other | Hub-and-spoke: ALL through Primary |
| **Orchestrator model** | Sonnet | **Opus** (complex coordination) |
| **Parallel execution** | Part of initial agent rollout | **Deferred** to Phase 5 |
| **SDK strategy** | Build custom SDK | **Use Task tool + configuration** |
| **Context isolation diagram** | Shows parallel flow | **All flows through Primary** |

---

## Action Items for Roadmap Enhancement

### Immediate (Before Enhancing roadmap.md)

1. **Validate understanding** with human reviewer
2. **Confirm Opus availability** for orchestrator role
3. **Review Task tool documentation** for spawning patterns

### For roadmap.md Updates

1. **Add Phase 2.5**: Model selection configuration
2. **Rename Phase 3**: "Hub-and-Spoke Agent Architecture" (not just Scout isolation)
3. **Add Phase 4**: Dynamic agent spawning
4. **Update Phase 5**: Parallel execution (clearly marked DEFERRED)
5. **Add architecture diagram**: Hub-and-spoke model
6. **Add model matrix**: Opus/Sonnet/Haiku assignments

### Documentation Artifacts Needed

| Artifact | Location | Purpose |
|----------|----------|---------|
| Orchestrator definition | `.claude/agents/orchestrator.md` | Primary agent behavior |
| Scout definition | `.claude/agents/scout.md` | Discovery agent |
| Builder definition | `.claude/agents/builder.md` | Implementation agent |
| Model config | `.claude/settings.json` | Model selection |
| Handoff protocol | `docs/specs/.../handoff-protocol.md` | Sub-agent → Primary format |

---

## References

- `Multi-Agent Orchestration with the Orchestrator Agent.txt` - Hub-and-spoke architecture
- `Advanced Agentic Coding The Orchestrator Agent Pattern.txt` - Orchestrator design
- `Agents.txt` - Sub-agent communication model (CRITICAL)
- `Claude Code SDK Custom Agents.txt` - SDK vs. Task tool decision
- `Introduction to Claude Haiku 4.5 and Sonnet 4.5.txt` - Model selection strategy
- Screenshot: Claude Code Sub Agent Flow - Visual confirmation of hub-and-spoke

---

## Summary

| Question | Answer |
|----------|--------|
| **Is SDK over-engineering?** | No, IF you use Task tool + config (not custom SDK code). Work IS portable. |
| **Do sub-agents talk to each other?** | **NO**. Primary Agent is ALWAYS the mediator. Hub-and-spoke model. |
| **Is 3 agents sufficient?** | 4 pre-defined (Orchestrator, Scout, Builder, Validator) + dynamic spawning |
| **What model for orchestrator?** | **Opus** (not Sonnet) - needs complex reasoning |
| **Parallel execution?** | DEFER to Phase 5 after agent architecture validated |
| **Current agent behavior?** | Have skills, NOT agents. Gap exists. |
