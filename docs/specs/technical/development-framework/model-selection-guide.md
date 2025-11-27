---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Model Selection Guide (Cost Optimization)

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: recommended
description: Decision matrix for choosing between Haiku and Sonnet models to optimize cost and performance
---
```

## Overview

Choosing the right model for each task can save 28% on typical Scout-Plan-Build workflows and 10x on pure discovery tasks.

**Cost Difference**:
- **Haiku**: ~$0.25 per 1M tokens (fast, efficient)
- **Sonnet**: ~$3.00 per 1M tokens (thorough, reasoning)
- **Savings**: Using Haiku for Scout = **10x cheaper** than Sonnet

---

## The Golden Rule

**Haiku**: Information retrieval, discovery, simple patterns, documentation (< 500 lines)

**Sonnet**: Design decisions, complex logic, multi-file reasoning, debugging

---

## Detailed Decision Matrix

| Task Type | Model | Approx Cost | When to Use | Example Commands |
|-----------|-------|-------------|-------------|------------------|
| **File discovery** | Haiku | ~$0.02 | Finding files by pattern or keyword | `claude --model haiku -p "find all auth-related files"` |
| **Code search** | Haiku | ~$0.02 | Searching for implementations | `claude --model haiku -p "search for JWT verification logic"` |
| **Documentation** | Haiku | ~$0.02 | Writing docs < 500 lines | `claude --model haiku -p "document the API endpoints"` |
| **Simple CRUD** | Haiku | ~$0.02 | Basic create/read/update/delete | `claude --model haiku -p "add basic user CRUD endpoints"` |
| **Scout phase** | Haiku | ~$0.02 | Reconnaissance for any feature | `claude --model haiku -p "scout the [feature-name] system"` |
| **Architecture** | Sonnet | ~$1-2 | Design decisions needed | Default model (no flag needed) |
| **Complex refactor** | Sonnet | ~$3-4 | Multi-file reasoning | Default model |
| **Debugging** | Sonnet | ~$2-3 | Requires deep analysis | Default model |
| **Orchestration** | Sonnet/Opus | ~$3-5 | Multi-agent coordination | Default model or `--model opus` |
| **Plan phase** | Sonnet | ~$1-2 | Strategic planning | Default model |
| **Build phase** | Sonnet | ~$2-4 | Implementation work | Default model |

---

## Cost Impact Analysis

### 10x Savings with Haiku

**Traditional Approach (all Sonnet)**:
```
├─ Scout:  $2.00
├─ Plan:   $1.50
├─ Build:  $3.00
└─ Total:  $6.50
```

**Optimized Approach (Haiku + Sonnet)**:
```
├─ Scout:  $0.20 (Haiku) ← 10x cheaper!
├─ Plan:   $1.50 (Sonnet)
├─ Build:  $3.00 (Sonnet)
└─ Total:  $4.70 (28% savings)
```

### Annual Cost Projection

Assuming 100 Scout-Plan-Build cycles per year:
- Traditional: $650/year
- Optimized: $470/year
- **Savings**: $180/year (28%)

For teams running 500+ cycles:
- **Savings**: $900/year

---

## Decision Flowchart

```
START
  ↓
Is this pure information retrieval?
  ├─ YES → Haiku
  └─ NO ↓
Is output < 500 lines?
  ├─ YES → Haiku
  └─ NO ↓
Does it require design decisions?
  ├─ YES → Sonnet
  └─ NO ↓
Is it straightforward CRUD/simple pattern?
  ├─ YES → Haiku
  └─ NO → Sonnet (default)
```

---

## Practical Examples

### Use Haiku For

**File Discovery**:
```bash
claude --model haiku -p "find all middleware files"
```

**Scout Phase**:
```bash
claude --model haiku -p "scout the authentication system to understand its structure"
```

**Simple Documentation**:
```bash
claude --model haiku -p "document the [ServiceName] class"
```

**Pattern Search**:
```bash
claude --model haiku -p "find examples of rate limiting in the codebase"
```

**Code Search**:
```bash
claude --model haiku -p "search for all SQL queries in routes/ folder"
```

**List Generation**:
```bash
claude --model haiku -p "list all API endpoints in the application"
```

---

### Use Sonnet For

**Complex Implementation** (default model):
```bash
claude -p "implement the notification system with real-time updates"
```

**Architecture Decisions** (default model):
```bash
claude -p "design the data model for the [feature] system"
```

**Debugging** (default model):
```bash
claude -p "debug why the OTP verification is failing"
```

**Refactoring** (default model):
```bash
claude -p "refactor the [ServiceName] to split it into focused services"
```

**Complex Planning** (default model):
```bash
claude -p "plan the implementation of [feature/compliance] across the application"
```

---

## Phase-Specific Recommendations

### Scout Phase → Haiku
**Why**: Pure discovery, no design decisions
```bash
claude --model haiku -p "scout [feature] to find all related files and patterns"
```

### Plan Phase → Sonnet
**Why**: Requires architectural reasoning
```bash
claude -p "create implementation plan based on scout findings"
```

### Build Phase → Sonnet
**Why**: Requires multi-file reasoning and consistency
```bash
claude -p "implement the plan for [feature]"
```

### Validate Phase → Sonnet
**Why**: Requires deep analysis to verify correctness
```bash
claude -p "validate the implementation matches the plan and specs"
```

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
