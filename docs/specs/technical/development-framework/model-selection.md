---
version: 2.0
status: active
last_updated: 2025-12-02
applies_to: framework
description: Decision matrix for choosing Haiku vs Sonnet AI models
---

# Model Selection Guide: Haiku vs Sonnet

---

## Overview

Choosing the right model for each task saves **28% on typical workflows** and **10x on discovery tasks**.

| Model Class | Examples | Cost (Claude) | Use For |
|-------------|----------|---------------|---------|
| **Lightweight** | Haiku, GPT-3.5 | ~$0.25/1M tokens | Discovery, search, docs |
| **Standard** | Sonnet, GPT-4 | ~$3.00/1M tokens | Design, complex logic |
| **Advanced** | Opus, GPT-4 Turbo | ~$15/1M tokens | Orchestration (rare) |

---

## The Golden Rule

```
Information retrieval, discovery, simple patterns → LIGHTWEIGHT (Haiku)
Design decisions, complex logic, multi-file → STANDARD (Sonnet)
```

---

## Phase-Specific Recommendations

| Phase | Model | Cost | Rationale |
|-------|-------|------|-----------|
| **Phase 0**: Constraints | Any | - | Just loading/checking |
| **Phase 1**: Scout | Lightweight | ~$0.02 | Pure discovery |
| **Phase 2**: Plan | Standard | ~$1.50 | Architectural reasoning |
| **Phase 3**: Build | Standard | ~$3.00 | Multi-file implementation |
| **Phase 4**: Validate | Standard | ~$1.00 | Deep analysis |
| **Orchestrate** (10+ files) | Standard/Advanced | ~$3-5 | Complex coordination |

---

## Decision Flowchart

```
START
  ↓
Is this pure information retrieval?
  ├─ YES → Lightweight
  └─ NO ↓
Is output < 500 lines of documentation?
  ├─ YES → Lightweight
  └─ NO ↓
Does it require design decisions?
  ├─ YES → Standard
  └─ NO ↓
Is it straightforward CRUD?
  ├─ YES → Lightweight
  └─ NO → Standard
```

---

## Cost Comparison

**All-Standard Approach**:
```
Scout:  $2.00
Plan:   $1.50
Build:  $3.00
Total:  $6.50
```

**Optimized Approach**:
```
Scout:  $0.20 (Lightweight) ← 10x cheaper
Plan:   $1.50 (Standard)
Build:  $3.00 (Standard)
Total:  $4.70 (28% savings)
```

---

## Tool-Specific Commands

### Claude CLI
```bash
# Scout with Haiku
claude --model haiku -p "scout the [feature] system"

# Build with Sonnet (default)
claude -p "implement the plan for [feature]"
```

### VS Code + GitHub Copilot
- Model selection typically automatic
- Simpler prompts → lighter model
- Complex prompts → heavier model

### Claude.ai Web
- Select model from dropdown
- Haiku for searches, Sonnet for implementation

---

## Quick Reference

| Task | Model | Cost |
|------|-------|------|
| File discovery | Lightweight | ~$0.02 |
| Code search | Lightweight | ~$0.02 |
| Documentation (<500 lines) | Lightweight | ~$0.02 |
| Simple CRUD | Lightweight | ~$0.02 |
| Architecture decisions | Standard | ~$1-2 |
| Complex refactoring | Standard | ~$3-4 |
| Debugging | Standard | ~$2-3 |
| Multi-agent orchestration | Standard/Advanced | ~$3-5 |

---

## Model Capabilities

### Lightweight (Haiku)
✅ Fast, cheap, great for discovery  
❌ Limited reasoning, misses subtle patterns

### Standard (Sonnet)
✅ Deep reasoning, consistent, multi-file  
❌ 10x more expensive, slower

---

## When in Doubt

1. "Find/read/discover?" → Haiku
2. "Think/design/decide?" → Sonnet
3. "Scout phase?" → Haiku
4. "Plan/Build phase?" → Sonnet

**Default to Sonnet if uncertain** - better to overspend than under-reason.
