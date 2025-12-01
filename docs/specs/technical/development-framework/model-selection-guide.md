---
version: 2.0
status: implemented
last_updated: 2025-11-30
---

# Model Selection Guide (Cost Optimization)

```yaml
---
version: 2.0
status: implemented
last_updated: 2025-11-30
applies_to: all
enforcement: recommended
description: Decision matrix for choosing between models to optimize cost and performance
tool_agnostic: true
---
```

## Overview

Choosing the right model for each task can save 28% on typical workflows and 10x on pure discovery tasks.

**Applies to**: Any AI coding tool (Claude CLI, GitHub Copilot, Claude.ai, etc.)

**Cost Comparison (Claude Models)**:
- **Haiku**: ~$0.25 per 1M tokens (fast, efficient)
- **Sonnet**: ~$3.00 per 1M tokens (thorough, reasoning)
- **Savings**: Using Haiku for Scout = **10x cheaper** than Sonnet

---

## The Golden Rule

**Lightweight Model (Haiku-class)**: Information retrieval, discovery, simple patterns, documentation (< 500 lines)

**Standard Model (Sonnet-class)**: Design decisions, complex logic, multi-file reasoning, debugging

---

## Detailed Decision Matrix

| Task Type | Model Class | Approx Cost | When to Use |
|-----------|-------------|-------------|-------------|
| **File discovery** | Lightweight | ~$0.02 | Finding files by pattern or keyword |
| **Code search** | Lightweight | ~$0.02 | Searching for implementations |
| **Documentation** | Lightweight | ~$0.02 | Writing docs < 500 lines |
| **Simple CRUD** | Lightweight | ~$0.02 | Basic create/read/update/delete |
| **Scout phase** | Lightweight | ~$0.02 | Reconnaissance for any feature |
| **Architecture** | Standard | ~$1-2 | Design decisions needed |
| **Complex refactor** | Standard | ~$3-4 | Multi-file reasoning |
| **Debugging** | Standard | ~$2-3 | Requires deep analysis |
| **Orchestration** | Standard/Advanced | ~$3-5 | Multi-agent coordination |
| **Plan phase** | Standard | ~$1-2 | Strategic planning |
| **Build phase** | Standard | ~$2-4 | Implementation work |

---

## Tool-Specific Commands

### Claude Code CLI
```bash
# Use Haiku for Scout phase
claude --model haiku -p "scout the [feature-name] system to understand its structure"

# Use Sonnet (default) for Build phase
claude -p "implement the plan for [feature]"
```

### VS Code + GitHub Copilot
- Model selection typically automatic based on context
- For discovery tasks, use simpler prompts
- For complex tasks, provide more detailed prompts

### Claude.ai Web
- Select model from dropdown when available
- Haiku for quick searches, Sonnet for implementation

---

## Cost Impact Analysis

### 10x Savings with Lightweight Models

**Traditional Approach (all Standard model)**:
```
├─ Scout:  $2.00
├─ Plan:   $1.50
├─ Build:  $3.00
└─ Total:  $6.50
```

**Optimized Approach (Lightweight + Standard)**:
```
├─ Scout:  $0.20 (Lightweight) ← 10x cheaper!
├─ Plan:   $1.50 (Standard)
├─ Build:  $3.00 (Standard)
└─ Total:  $4.70 (28% savings)
```

---

## Decision Flowchart

```
START
  ↓
Is this pure information retrieval?
  ├─ YES → Lightweight model
  └─ NO ↓
Is output < 500 lines?
  ├─ YES → Lightweight model
  └─ NO ↓
Does it require design decisions?
  ├─ YES → Standard model
  └─ NO ↓
Is it straightforward CRUD/simple pattern?
  ├─ YES → Lightweight model
  └─ NO → Standard model
```

---

## Phase-Specific Recommendations

### Phase 0 (Constraints) → Any Model
**Why**: Just loading/checking constraints

### Scout Phase → Lightweight Model
**Why**: Pure discovery, no design decisions

### Plan Phase → Standard Model
**Why**: Requires architectural reasoning

### Build Phase → Standard Model
**Why**: Requires multi-file reasoning and consistency

### Validate Phase → Standard Model
**Why**: Requires deep analysis to verify correctness

### Orchestrate Phase → Sonnet or Opus
**Why**: Complex coordination logic
```bash
claude -p "orchestrate parallel agents to implement [large feature]"
# Or for very complex orchestration:
claude --model opus -p "orchestrate parallel agents..."
```

---

## When in Doubt

Ask yourself these questions:

1. **"Am I asking it to find/read/discover?"** → Haiku
2. **"Am I asking it to think/design/decide?"** → Sonnet
3. **"Is the output straightforward?"** → Haiku
4. **"Does this need reasoning?"** → Sonnet
5. **"Is this a Scout phase task?"** → Haiku
6. **"Is this a Plan/Build phase task?"** → Sonnet

**Default to Sonnet if uncertain** - it's better to use Sonnet unnecessarily than to use Haiku for complex tasks that need reasoning.

---

## Model Capabilities Reference

### Haiku Strengths
- ✅ Fast response time
- ✅ Cost-effective (10x cheaper)
- ✅ Great for information retrieval
- ✅ Good for simple, repetitive tasks
- ✅ Excellent for documentation < 500 lines
- ✅ Perfect for file/code discovery

### Haiku Limitations
- ❌ Limited reasoning depth
- ❌ Not ideal for complex logic
- ❌ May miss subtle patterns
- ❌ Less consistent with large outputs

### Sonnet Strengths
- ✅ Deep reasoning capabilities
- ✅ Excellent for architecture
- ✅ Consistent with complex tasks
- ✅ Better at multi-file reasoning
- ✅ Superior debugging abilities
- ✅ More reliable for production code

### Sonnet Limitations
- ❌ 10x more expensive than Haiku
- ❌ Slower response time
- ❌ Overkill for simple discovery

---

## Integration with SDD/TAC Workflow

### Minimal Workflow (3-10 files)
```bash
# 1. Scout with Haiku (cheap discovery)
claude --model haiku -p "scout [feature]"

# 2. Plan with Sonnet (reasoning needed)
claude -p "create plan based on scout findings"

# 3. Build with Sonnet (implementation)
claude -p "implement the plan"
```

**Cost**: ~$4.70 per cycle (vs $6.50 without optimization)

### Large Workflow (10+ files, parallel agents)
```bash
# 1. Scout with Haiku (parallel if multi-domain)
claude --model haiku -p "scout auth system"
claude --model haiku -p "scout API routes"
claude --model haiku -p "scout database schema"

# 2. Plan with Sonnet (aggregate findings)
claude -p "create unified plan from all scout reports"

# 3. Build with Sonnet (parallel agents)
# Each agent gets Sonnet for implementation quality

# 4. Orchestrate with Sonnet/Opus
claude -p "coordinate the parallel agents and resolve conflicts"
```

**Cost Savings**: 30-40% by using Haiku for all Scout phases

---

## Monitoring and Optimization

### Track Your Costs

Keep a simple log:
```
Task: Scout [feature-name] | Model: Haiku | Cost: $0.02
Task: Plan [feature-name]  | Model: Sonnet | Cost: $1.50
Task: Build [feature-name] | Model: Sonnet | Cost: $3.00
Total: $4.52
```

### Identify Optimization Opportunities

If you find yourself using Sonnet for:
- File discovery → Switch to Haiku
- Code search → Switch to Haiku
- Simple documentation → Switch to Haiku
- List generation → Switch to Haiku

### Calculate ROI

```
Sonnet Scouts per month: 20
Cost with Sonnet: 20 × $2.00 = $40
Cost with Haiku:  20 × $0.02 = $0.40
Monthly Savings: $39.60
Annual Savings:  $475.20
```

---

## Best Practices

### DO
- ✅ Use Haiku for all Scout phases
- ✅ Use Haiku for documentation < 500 lines
- ✅ Use Haiku for file/code discovery
- ✅ Use Sonnet for Plan/Build phases
- ✅ Use Sonnet for debugging
- ✅ Default to Sonnet when uncertain

### DON'T
- ❌ Use Sonnet for simple file discovery
- ❌ Use Haiku for complex architecture decisions
- ❌ Use Haiku for multi-file refactoring
- ❌ Use Haiku when reasoning is critical
- ❌ Sacrifice quality to save $1-2 on important tasks

---

## Related Specs

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Core workflow using these models
- [Context Management](./context-management.md) - Managing context costs
- [Agent Orchestration](./agent-orchestration.md) - Model selection for parallel agents

---

**Summary**: Use Haiku for discovery, Sonnet for decisions. Save 28% without sacrificing quality.
