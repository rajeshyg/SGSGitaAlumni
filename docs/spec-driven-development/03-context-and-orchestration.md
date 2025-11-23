# Module 3: Context Engineering & Multi-Agent Orchestration

[← Previous: Agentic Patterns](./02-agentic-patterns.md) | [Back to Guide](./README.md) | [Next: Implementation Techniques →](./04-implementation-techniques.md)

---

## Context Engineering: The R&D Framework

Context window management is critical for agent performance. Use the **Reduce & Delegate** framework.

### Reduce Strategies

#### 1. Strategic Tool Management
**Problem**: Default configurations load all available tools, consuming 10-15% of context before work begins.

**Solution**:
```bash
# Instead of loading all MCP servers by default
# Load only what's needed for the current task

# For a documentation task:
claude --mcp filesystem,web-search

# For an API development task:
claude --mcp filesystem,terminal,api-docs
```

#### 2. Context Priming (Not Static Memory)
**Problem**: Large static memory files (like `claude.md`) consume context continuously and grow uncontrolled.

**Solution**: Create task-specific priming commands
```markdown
# /prime-bug.md
You are debugging a production issue.
Focus on:
- Error logs and stack traces
- Recent changes in affected files
- Related test failures
Key files: [dynamic list]
```

```markdown
# /prime-feature.md
You are implementing a new feature.
Focus on:
- Feature specification
- Architectural patterns
- Integration points
Key principles: [from constitution]
```

Usage:
```bash
# Load only relevant context
/prime bug
# Then work on the issue
```

#### 3. Minimize Always-On Context
Keep the base `constitution.md` or instructions file under 50 lines:
```markdown
# Essential Project Context (Always On)

## Stack
TypeScript, React, Node.js, PostgreSQL

## Critical Patterns
- Use async/await, not promises.then
- All API routes must validate input
- Tests required for all new features

## Never
- Modify production database directly
- Commit secrets or API keys
- Use console.log (use logger)
```

### Delegate Strategies

#### 1. Sub-Agent Delegation
**Concept**: Heavy tasks run in isolated sub-agents, returning only results.

**Example**: Documentation Loading
```markdown
# Main Agent Prompt
Please analyze the new authentication flow.

# Behind the scenes, sub-agent runs:
SYSTEM: You are a documentation loader.
1. Fetch OAuth 2.0 spec from web
2. Read our auth architecture docs
3. Extract key implementation details
4. Return a 500-word summary
OUTPUT: [summary only, not the full docs]

# Main agent receives:
"Summary: OAuth 2.0 requires... [condensed info]"
```

**Token Savings**: 50,000+ tokens reduced to 500 tokens

#### 2. Scout-Plan-Build Pattern
Separate concerns across specialized agents:

```markdown
# Scout Agent (Fast, Cheap Model)
Task: Find all files related to user authentication
Model: claude-haiku-4 (cheap, fast)
Output: file_list.json (10 lines)

# Planner Agent (Reasoning Model)
Task: Design the implementation
Input: file_list.json + spec
Model: claude-sonnet-4 (thorough)
Output: implementation_plan.md (500 lines)

# Builder Agent (Execution Model)
Task: Implement the changes
Input: implementation_plan.md + relevant files only
Model: claude-sonnet-4
Context: Only the 3-5 files it needs to modify
```

**Benefit**: Each agent has a focused, clean context window.

#### 3. Context Bundles (State Management)
**Problem**: When context window fills up, the agent loses state.

**Solution**: Create session summaries
```markdown
# Auto-generated context_bundle.md after each session

## Session Summary
Date: 2025-11-22
Task: Implement OAuth authentication

## Actions Taken
- Modified: src/auth/oauth.ts (added token refresh)
- Created: src/middleware/jwt-verify.ts
- Updated: tests/auth/oauth.test.ts (added 5 tests)

## Decisions Made
- Using jose library for JWT (lighter than jsonwebtoken)
- Tokens expire in 1 hour, refresh tokens in 30 days
- Storing tokens in Redis, not database

## Next Steps
- Integrate with frontend
- Add token revocation endpoint
- Update API documentation

## Key Files
src/auth/oauth.ts, src/middleware/jwt-verify.ts, tests/auth/oauth.test.ts
```

**Usage**: When context fills, start new agent with:
```markdown
Read context_bundle.md from the previous session and continue the work.
```

**Result**: 60-70% of state restored with fraction of tokens.

---

## Multi-Agent Orchestration Patterns

### The Orchestrator Agent Pattern

**Concept**: One "manager" agent coordinates multiple "worker" agents.

#### Core Pillars

1. **Orchestrator Agent**: Single interface for high-level commands
2. **Agent CRUD**: Create, Read, Update, Delete agents dynamically
3. **Observability**: Real-time monitoring of all agents

#### Architecture

```
┌─────────────────────────────────────────┐
│         ENGINEER (You)                  │
│  High-level command: "Implement X"      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│      ORCHESTRATOR AGENT                │
│  - Breaks down task                    │
│  - Creates specialized agents          │
│  - Monitors progress                   │
│  - Aggregates results                  │
└─────┬─────────┬──────────┬─────────────┘
      │         │          │
      ▼         ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Scout   │ │ Builder │ │   QA    │
│ Agent   │ │ Agent   │ │  Agent  │
└─────────┘ └─────────┘ └─────────┘
```

#### Implementation Example

**Step 1: Orchestrator Receives Command**
```markdown
ENGINEER: "Update the user profile page to include a bio field"

ORCHESTRATOR THINKS:
1. Need to scout the codebase
2. Need to plan the implementation
3. Need to implement frontend and backend
4. Need to test the changes
```

**Step 2: Orchestrator Creates Agents**
```markdown
ORCHESTRATOR CREATES:

Agent: scout-001
Task: Find all files related to user profiles
Model: claude-haiku-4 (fast)
Tools: file_search, grep
Context: Minimal

Agent: planner-001
Task: Design the bio field implementation
Model: claude-sonnet-4 (thorough)
Input: scout-001 output
Context: Spec + architecture docs

Agent: builder-frontend-001
Task: Add bio field to profile UI
Model: claude-sonnet-4
Input: planner-001 output + frontend files only

Agent: builder-backend-001
Task: Add bio field to API and database
Model: claude-sonnet-4
Input: planner-001 output + backend files only

Agent: qa-001
Task: Test the complete feature
Model: claude-sonnet-4
Input: All builder outputs
Tools: test_runner, browser
```

**Step 3: Execution**
```markdown
[Scout] ✓ Found 8 relevant files
[Planner] ✓ Created 3-phase implementation plan
[Builder-Frontend] ✓ Modified 3 files, added bio input component
[Builder-Backend] ✓ Updated schema, API routes, validation
[QA] ✓ All tests passing, manual verification complete
```

**Step 4: Cleanup**
```markdown
ORCHESTRATOR:
- All agents completed successfully
- Deleting temporary agents (scout, planner, builders, qa)
- Preserving outputs in results/profile-bio-feature/
```

### Benefits of Orchestration

1. **Context Protection**: Orchestrator stays clean; workers handle details
2. **Parallelism**: Frontend and backend builders run simultaneously
3. **Specialization**: Each agent optimized for its specific task
4. **Scalability**: Spin up 10 agents as easily as 1
5. **Observability**: Track each agent's progress independently

### Observability Dashboard

Essential metrics to track:
```markdown
┌──────────────────────────────────────────┐
│  Agent Dashboard                         │
├──────────────────────────────────────────┤
│  Active Agents: 5                        │
│  - scout-001: Scanning codebase (70%)    │
│  - builder-001: Writing code (40%)       │
│  - builder-002: Writing code (55%)       │
│  - qa-001: Waiting for builders          │
│  - monitor-001: Watching logs            │
├──────────────────────────────────────────┤
│  Completed Today: 23 agents              │
│  Success Rate: 91%                       │
│  Avg Duration: 3.2 minutes               │
│  Total Cost: $4.23                       │
├──────────────────────────────────────────┤
│  Files Consumed: 47                      │
│  Files Produced: 18                      │
│  Tool Calls: 142                         │
│  Tokens Used: 287K input, 95K output     │
└──────────────────────────────────────────┘
```

---

## Practical Context Management Examples

### Example 1: Large Codebase Navigation

**Problem**: Need to implement a feature in a 100K+ line codebase

**Solution**:
```markdown
# Phase 1: Scout (Haiku - $0.10 per 1M tokens)
Task: Find all authentication-related files
Output: 15 relevant files identified
Cost: $0.05

# Phase 2: Filter (Haiku)
Task: Read first/last 50 lines of each file, identify core files
Output: 5 core files + 10 supporting files
Cost: $0.03

# Phase 3: Deep Analysis (Sonnet - $3 per 1M tokens)
Task: Analyze only the 5 core files in detail
Output: Implementation plan
Cost: $0.45

# Phase 4: Implementation (Sonnet)
Task: Implement changes in identified files
Output: Working feature
Cost: $1.20

Total Cost: $1.73 (vs $10+ without context management)
```

### Example 2: Documentation Generation

**Problem**: Generate comprehensive API documentation

**Solution**:
```markdown
# Use Sub-Agent for Heavy Lifting

Main Agent: "Generate API documentation"
  ↓
Sub-Agent Created:
  - Task: Extract all API routes
  - Task: Analyze input/output schemas
  - Task: Find example requests in tests
  - Output: Structured data (JSON)
  
Main Agent receives JSON:
{
  "endpoints": [...],
  "schemas": [...],
  "examples": [...]
}
  ↓
Main Agent generates markdown documentation
```

**Benefit**: Sub-agent context discarded after completion, main agent stays efficient.

### Example 3: Cross-Module Refactoring

**Problem**: Refactor authentication across 20+ files

**Solution**: Parallel Agent Execution
```markdown
# Orchestrator divides work:

Group A (Parallel):
- Agent-1: Refactor routes/ (5 files)
- Agent-2: Refactor middleware/ (3 files)
- Agent-3: Refactor services/ (4 files)
- Agent-4: Refactor utils/ (2 files)

Each agent:
- Receives only its files
- Has clean context
- Works independently

Group B (Sequential, after A completes):
- Agent-5: Update tests
- Agent-6: Update documentation

Result: 4x faster completion time
```

---

## Context Bundle Best Practices

### When to Create Context Bundles

1. **Session Ending**: Before closing a long work session
2. **Context Near Limit**: When token usage approaches 80%
3. **Phase Transition**: After completing a major milestone
4. **Handoff**: When passing work to another developer/agent
5. **Daily Standup**: End-of-day summary for continuity

### What to Include in Bundles

```markdown
# Context Bundle Template

## Session Metadata
- Date: {{ date }}
- Duration: {{ hours }}
- Task: {{ task_name }}
- Status: {{ in_progress | completed | blocked }}

## Work Completed
- Files Modified: {{ file_list }}
- Features Implemented: {{ feature_list }}
- Tests Added: {{ test_count }}
- Bugs Fixed: {{ bug_list }}

## Technical Decisions
- {{ decision_1 }}: {{ rationale }}
- {{ decision_2 }}: {{ rationale }}

## Current State
- Working: {{ what_works }}
- Pending: {{ what_remains }}
- Blocked: {{ blockers }}

## Next Actions
1. {{ action_1 }}
2. {{ action_2 }}

## Key Context
- Important Files: {{ file_paths }}
- Critical Functions: {{ function_names }}
- Dependencies: {{ dependency_list }}
```

### Automated Bundle Generation

```bash
# Script: generate-context-bundle.sh

# Collect git changes
git diff --name-only > changed_files.txt

# Collect recent commits
git log --oneline -5 > recent_commits.txt

# Generate bundle
cat > context_bundle.md << EOF
# Context Bundle - $(date +%Y-%m-%d)

## Changes Made
$(git diff --stat)

## Recent Commits
$(cat recent_commits.txt)

## Modified Files
$(cat changed_files.txt)

## Current Branch
$(git branch --show-current)

## Next Steps
[To be filled by agent/developer]
EOF
```

---

## Key Takeaways

1. **Reduce Context**: Minimize always-on memory, use task-specific priming
2. **Delegate Strategically**: Use sub-agents for heavy lifting
3. **Scout-Plan-Build**: Separate discovery, planning, and execution
4. **Orchestrate**: Use manager pattern for complex multi-file work
5. **Track Progress**: Implement observability dashboards
6. **Bundle State**: Create session summaries for continuity
7. **Choose Right Model**: Scout with cheap models, build with capable ones

---

## Next Steps

Learn practical implementation techniques and tool selection:

**[Continue to Module 4: Implementation Techniques & Tools →](./04-implementation-techniques.md)**

Or return to the [main guide](./README.md) to choose a different module.
