# Agent Infrastructure Research Decision

**Date**: 2025-12-05
**Decision**: DEFER custom agents, apply behavioral fixes first
**Status**: Skills enhanced, pending re-test

---

## Executive Summary

Research into IndyDevDan's documentation and official Claude Code docs revealed that custom subagents (`.claude/agents/` files) **cannot solve the test failures** because:

1. **3/4 test failures were decision-making failures**, not context isolation issues
2. Custom subagents can't enforce behavior on the primary agent
3. IndyDevDan's full orchestrator pattern requires SDK development

**Solution Applied**: Enhanced skills to MANDATE `AskUserQuestion` tool usage instead of text templates.

---

## Research Findings

### What We Thought Would Work

**Original Hypothesis**: Create custom agents in `.claude/agents/`:
- `scout.md` - Explore codebase, return summary
- `orchestrator.md` - Coordinate phases
- `builder.md` - Execute with clean context

### What Research Revealed

#### IndyDevDan's Full Orchestrator (Requires SDK)

From `Advanced Agentic Coding The Orchestrator Agent Pattern.txt`:
- Requires **CRUD operations** for agents (Create, Read, Update, Delete)
- Uses **Claude Code SDK** (`ClaudeSDKClient`, `Query` methods)
- Spawns **background primary agents** via CLI
- Needs **custom observability** dashboard

**This is NOT achievable with simple `.claude/agents/` markdown files.**

#### What `.claude/agents/` Actually Provides

From official Claude Code docs:
- Custom subagent definitions with YAML frontmatter
- Auto-invoked by Claude when description matches context
- Tool restrictions via `tools` field
- **Limitation**: Subagents cannot spawn other subagents
- **Key Issue**: Primary agent still decides whether to invoke them

### Root Cause of Test Failures

| Test | Failed Because | Would Custom Agents Fix? |
|------|----------------|--------------------------|
| Test 1 | Didn't ask before creating | **NO** - primary agent decides |
| Test 2 | Didn't check existing ErrorBoundary | Partially - scout could find |
| Test 3 | 75k tokens consumed | **YES** - context isolation |
| Test 4 | Didn't reuse existing component | **NO** - decision-making issue |
| Test 5 | PASSED - used AskUserQuestion | N/A |

**Key Insight**: 3/4 failures were because skills said "stop and ask" but used TEXT TEMPLATES instead of mandating the `AskUserQuestion` TOOL.

---

## Solution Applied

### Skills Enhanced

1. **`sdd-tac-workflow/SKILL.md`**
   - Added `## MANDATORY: Use AskUserQuestion Tool` section
   - Specifies exact JSON format for tool usage
   - Triggers: AFTER Scout, BEFORE Plan, BEFORE creating new files

2. **`duplication-prevention.md`**
   - Added tool requirement with JSON example
   - Replaced text template with explicit tool mandate
   - Added warning: "Text questions are NOT acceptable"

### Why This Should Work

Test 5 (the only passing test) succeeded because `AskUserQuestion` was used. The fix makes tool usage mandatory, not optional.

---

## Agent Infrastructure Status

| Component | Previous Status | New Status | Reason |
|-----------|----------------|------------|--------|
| `.claude/agents/` | 🔴 TODO | ⏸️ DEFERRED | Can't enforce behavior |
| `orchestrator.md` | 🔴 TODO | ⏸️ DEFERRED | Requires SDK |
| `scout.md` | 🔴 TODO | ⏸️ DEFERRED | Built-in Task tool may suffice |
| `builder.md` | 🔴 TODO | ⏸️ DEFERRED | Not needed if skills work |

---

## Next Steps

1. **Re-run validation tests** (Tests 1-4) with enhanced skills
2. **Measure** "Stop and Ask" compliance rate
3. **If pass rate improves significantly**: Agents confirmed unnecessary
4. **If still failing**: Pursue SDK-based orchestrator development

---

## Sources

- IndyDevDan: "Advanced Agentic Coding: The Orchestrator Agent Pattern"
- IndyDevDan: "Claude Code SDK Custom Agents"
- IndyDevDan: "Elite Context Engineering with Claude Code"
- Official Claude Code docs: Sub-agents
- Test results: `docs/context-bundles/2025-12-03-framework-validation-tests.md`

---

## Why Claude Was Initially Pushing for Agents

The user asked Claude to implement the agent infrastructure based on IndyDevDan's research. Claude initially agreed because:

1. The test results (1/5 pass rate) seemed to validate the need
2. Context bloat in Test 3 (75k tokens) suggested isolation was needed
3. IndyDevDan's orchestrator pattern appeared to be the solution

However, deeper research revealed:
- Custom subagents can't enforce behavior on the primary agent
- The root cause was skill implementation (text vs tool), not architecture
- Simpler behavioral fix should be tried first

This demonstrates the importance of **thorough research before implementation**, even when the user provides a specific direction.
