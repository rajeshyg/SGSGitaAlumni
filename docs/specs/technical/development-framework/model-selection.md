---
version: 3.0
status: active
last_updated: 2025-12-05
applies_to: framework
description: Model stack strategy for hub-and-spoke agent architecture (Opus/Sonnet/Haiku)
---

# Model Selection Guide: Opus, Sonnet, Haiku Stack

---

## Overview

The **model stack** strategy optimizes cost and quality by assigning the right model to each agent role.

| Model Class | Examples | Cost (Claude) | Use For |
|-------------|----------|---------------|---------|
| **Lightweight** | Haiku | ~$0.25/1M tokens | Discovery, validation, docs |
| **Standard** | Sonnet | ~$3.00/1M tokens | Implementation, design |
| **Advanced** | **Opus** | ~$15/1M tokens | **Orchestration (REQUIRED)** |

> **Update 2025-12-05**: Research confirmed Opus is REQUIRED for orchestrator role - complex coordination needs Opus-level reasoning.

---

## Agent-Specific Model Assignment

### Hub-and-Spoke Architecture

| Agent | Model | Cost | Why This Model |
|-------|-------|------|----------------|
| **Orchestrator** | **Opus** | ~$15/1M | Complex coordination, synthesis, decision-making |
| Scout | Haiku | ~$0.25/1M | Fast discovery, pattern matching |
| Builder | Sonnet | ~$3/1M | Code generation, implementation |
| Validator | Haiku | ~$0.25/1M | Structured validation, checklist verification |

### Why Opus for Orchestrator?

The Orchestrator needs to:
1. **Understand** complex, ambiguous user requests
2. **Break down** tasks into sub-agent assignments
3. **Decide** which agent to spawn and when
4. **Synthesize** results from multiple agents
5. **Judge** quality and completeness

> "Haiku is not a good planner for deep thinking or complex tasks" - IndyDevDan

Sonnet handles implementation well but lacks the **meta-reasoning** needed for orchestration.

---

## The Golden Rule

```
Orchestration, complex decisions    → OPUS (Advanced)
Implementation, design decisions    → SONNET (Standard)
Discovery, validation, simple tasks → HAIKU (Lightweight)
```

---

## Phase-Specific Recommendations

| Phase | Agent | Model | Cost | Rationale |
|-------|-------|-------|------|-----------|
| **Phase 0**: Constraints | Any | Any | - | Just loading/checking |
| **Phase 1**: Scout | Scout | Haiku | ~$0.02 | Pure discovery |
| **Phase 2**: Plan | Orchestrator | Opus | ~$2.00 | Architectural reasoning |
| **Phase 3**: Build | Builder | Sonnet | ~$3.00 | Multi-file implementation |
| **Phase 4**: Validate | Validator | Haiku | ~$0.20 | Checklist verification |
| **Orchestrate** | Orchestrator | **Opus** | ~$5.00 | Complex multi-agent coordination |

---

## Cost Comparison

### All-Sonnet Approach (Old)
```
Scout:       $2.00 (Sonnet - overkill)
Plan:        $1.50 (Sonnet)
Build:       $3.00 (Sonnet)
Validate:    $1.00 (Sonnet - overkill)
────────────────────
Total:       $7.50
```

### Optimized Stack (New)
```
Scout:       $0.20 (Haiku)     ← 10x cheaper
Plan:        $2.00 (Opus)      ← Better reasoning
Build:       $3.00 (Sonnet)
Validate:    $0.20 (Haiku)     ← 5x cheaper
────────────────────
Total:       $5.40 (28% savings + better quality)
```

### Cost Per Agent Role

| Role | Model | Input Cost | Output Cost | Typical Task Cost |
|------|-------|------------|-------------|-------------------|
| Scout | Haiku | $0.25/1M | $1.25/1M | ~$0.02-0.20 |
| Orchestrator | Opus | $15/1M | $75/1M | ~$2.00-5.00 |
| Builder | Sonnet | $3/1M | $15/1M | ~$3.00-4.00 |
| Validator | Haiku | $0.25/1M | $1.25/1M | ~$0.02-0.20 |

---

## Decision Flowchart

```
START
  ↓
Is this orchestration/coordination?
  ├─ YES → OPUS (Orchestrator)
  └─ NO ↓
Is this code implementation?
  ├─ YES → SONNET (Builder)
  └─ NO ↓
Is this discovery/search?
  ├─ YES → HAIKU (Scout)
  └─ NO ↓
Is this validation/verification?
  ├─ YES → HAIKU (Validator)
  └─ NO → SONNET (default)
```

---

## Tool-Specific Commands

### Claude CLI
```bash
# Scout with Haiku (explicit model)
claude --model haiku -p "scout the [feature] system"

# Build with Sonnet (explicit model)
claude --model sonnet -p "implement the plan for [feature]"

# Orchestrate with Opus (for complex multi-agent tasks)
claude --model opus -p "coordinate implementation of [feature]"
```

### VS Code + GitHub Copilot
- Model selection typically automatic
- Simpler prompts → lighter model
- Complex prompts → heavier model

### Claude.ai Web
- Select model from dropdown
- Haiku for searches
- Sonnet for implementation
- Opus for complex planning

---

## Quick Reference

| Task | Agent | Model | Cost |
|------|-------|-------|------|
| File discovery | Scout | Haiku | ~$0.02 |
| Code search | Scout | Haiku | ~$0.02 |
| Documentation | Scout | Haiku | ~$0.02 |
| Simple CRUD | Builder | Sonnet | ~$1.00 |
| Architecture decisions | Orchestrator | Opus | ~$2.00 |
| Complex refactoring | Builder | Sonnet | ~$3-4 |
| Debugging | Builder | Sonnet | ~$2-3 |
| Quality checks | Validator | Haiku | ~$0.20 |
| Multi-agent orchestration | Orchestrator | **Opus** | ~$5.00 |

---

## Model Capabilities

### Haiku (Lightweight)
✅ Fast, cheap, great for discovery  
✅ Excellent at pattern matching and search  
❌ Limited reasoning, misses subtle patterns  
❌ Not suitable for complex decisions

**Best For**: Scout, Validator, DocWriter

### Sonnet (Standard)
✅ Deep reasoning, consistent, multi-file  
✅ Excellent code generation  
❌ 10x more expensive than Haiku  
❌ Slower than Haiku

**Best For**: Builder, TestWriter, Refactorer

### Opus (Advanced)
✅ Complex reasoning, synthesis  
✅ Multi-step planning and coordination  
✅ Handles ambiguous requests well  
❌ 60x more expensive than Haiku  
❌ Slowest model

**Best For**: Orchestrator (REQUIRED)

---

## When in Doubt

1. "Coordinate/orchestrate/decide?" → **Opus**
2. "Implement/build/create?" → **Sonnet**
3. "Find/read/discover/validate?" → **Haiku**
4. "Scout phase?" → **Haiku**
5. "Plan phase?" → **Opus**
6. "Build phase?" → **Sonnet**
7. "Validate phase?" → **Haiku**

**For orchestration**: ALWAYS use Opus - the cost is justified by better decision-making.

---

## Configuration

### Recommended settings.json

```json
{
  "agents": {
    "orchestrator": { 
      "model": "opus",
      "role": "Coordination, synthesis, decision-making"
    },
    "scout": { 
      "model": "haiku", 
      "role": "Fast discovery, pattern matching"
    },
    "builder": { 
      "model": "sonnet", 
      "role": "Code generation, implementation"
    },
    "validator": { 
      "model": "haiku", 
      "role": "Structured validation"
    }
  }
}
```

---

## References

- **Agent Engineering**: [agent-engineering.md](./agent-engineering.md)
- **Architecture Research**: `docs/context-bundles/2025-12-05-agent-architecture-research.md`
- **IndyDevDan Model Stack**: `docs/archive/root-docs/IndyDevDan_TAC/Introduction to Claude Haiku 4.5 and Sonnet 4.5.txt`
