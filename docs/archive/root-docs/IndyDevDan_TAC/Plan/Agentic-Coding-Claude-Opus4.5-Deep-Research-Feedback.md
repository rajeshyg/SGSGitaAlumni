# AI Agentic Coding Frameworks: Best Practices and Anti-Patterns

**The industry consensus is clear: simplicity wins.** Anthropic officially advises "finding the simplest solution possible, and only increasing complexity when needed—this might mean not building agentic systems at all." Yet when agentic systems are warranted, specific architectural patterns dramatically improve outcomes. A UC Berkeley study of 1,600+ traces found **75% failure rates** in poorly-designed multi-agent systems, with most failures stemming from coordination breakdowns, not model limitations.

This report synthesizes Anthropic's official guidance, industry research, and production lessons to identify alignment gaps and improvement opportunities for any custom agentic framework including SDD (Spec-Driven Development) and TAC (Tactical Agentic Coding) approaches.

---

## Anthropic's core philosophy: complexity is a liability

Anthropic draws a critical distinction between **workflows** (LLMs orchestrated through predefined code paths) and **agents** (LLMs dynamically directing their own processes). Their official recommendation is unambiguous: "For many applications, optimizing single LLM calls with retrieval and in-context examples is usually enough. Agentic systems trade latency and cost for better task performance—consider when this tradeoff makes sense."

The company warns against over-reliance on frameworks: "Start by using LLM APIs directly; many patterns can be implemented in a few lines of code. If you use a framework, ensure you understand the underlying code. **Incorrect assumptions about what's under the hood are a common source of customer error.**"

When multi-agent systems are justified, Anthropic's internal benchmarks show their multi-agent research system (Claude Opus 4 lead + Sonnet subagents) **outperformed single-agent Claude Opus 4 by 90.2%**—but at a cost of **15× more tokens** than standard chat interactions. This economics equation should drive architectural decisions: multi-agent systems are best suited for "tasks where the value is high enough to pay for increased performance."

---

## Context engineering determines success or failure

The most critical insight from Anthropic's engineering team: "Most agent failures are not model failures anymore—they are context failures." Context engineering is defined as "the art and science of curating what will go into the limited context window from a constantly evolving universe of possible information."

### The "context rot" problem

As tokens increase, model ability to accurately recall information decreases. This degradation affects agents attempting long-horizon tasks, creating a fundamental tension between providing comprehensive context and maintaining model performance.

### Three strategies for long-horizon tasks

**Compaction** involves summarizing conversation history when nearing context limits. Claude Code implements this by passing message history to the model for compression, preserving architectural decisions, unresolved bugs, and implementation details while discarding redundant tool outputs. Anthropic recommends starting by maximizing recall, then iterating to improve precision.

**Structured note-taking** (agentic memory) has the agent regularly write notes persisted outside the context window—for example, creating a `TODO.md` or `NOTES.md` file. These notes get pulled back at later times, enabling persistence without context bloat.

**Sub-agent architectures** provide the most powerful isolation pattern. Each subagent "might explore extensively, using tens of thousands of tokens or more, but returns only a condensed, distilled summary (often 1,000-2,000 tokens)." This creates natural compression boundaries while maintaining clean context windows.

### System prompt "Goldilocks zone"

Anthropic identifies two failure modes for system prompts: too specific (hardcoding complex, brittle logic that creates fragility) and too vague (high-level guidance that fails to give concrete signals). The optimal approach is "specific enough to guide behavior effectively, yet flexible enough to provide strong heuristics."

---

## The proven orchestration patterns for multi-agent systems

Microsoft Azure Architecture Center and LangChain research have identified six fundamental patterns, each suited to different problem types.

### Supervisor pattern (recommended for complex coordination)

A central orchestrator receives user requests, decomposes them into subtasks, and delegates to specialized agents. **LangChain benchmarks show supervisor architecture maintains flat token usage as distractor domains grow**, unlike single-agent systems that degrade. This pattern provides the best traceability and is recommended for complex, multi-domain workflows.

### Swarm architecture (slightly higher performance)

Sub-agents can respond to users directly without routing through an orchestrator. LangChain benchmarks show swarm architecture "slightly outperforms supervisor across the board due to avoiding 'telephone game' translation issues"—but at the cost of reduced control and traceability.

### Sequential (pipeline) and concurrent (fan-out/fan-in) patterns

Sequential chains agents in predefined linear order—best for multi-stage processes with clear dependencies. Concurrent runs multiple agents simultaneously on the same task from different perspectives—best for tasks benefiting from diverse viewpoints, brainstorming, or ensemble reasoning.

### Key implementation insight: subagent-as-tool

The most effective pattern treats subagents as callable tools with explicit context control points: subagent name (influences prompting), tool description (guides when to invoke), context injection via state transformation, and result filtering/summarization. This creates clean boundaries and predictable behavior.

---

## Spec-driven development with AI agents

The industry is converging on specification-first approaches. GitHub's Spec-Kit framework and AWS's Kiro both implement workflows where specifications precede implementation.

### Effective spec structure

Specifications should capture: specific input/output formats and data types, explicit business rules and edge cases, integration constraints and existing system dependencies, performance requirements and expected scale, error handling and validation rules, and security and compliance requirements.

The workflow proceeds through four phases: **Specification** (captures requirements, intentions, constraints as markdown), **Plan** (technical decisions, architecture, tech stack), **Tasks** (small, reviewable chunks solving specific pieces), and **Implementation** (agent tackles tasks one by one).

### Critical caution from Martin Fowler

"Even with large context windows, AI may not properly pick up on everything—agents may ignore instructions or go overboard following them too eagerly." This argues for explicit verification steps rather than assuming spec compliance.

---

## Configuration best practices: CLAUDE.md, hooks, and settings

### CLAUDE.md files

These project-specific context files load automatically in Claude Code. They support hierarchical organization: `~/.claude/CLAUDE.md` for user-level preferences, project root for project settings, subdirectory-specific files loaded when reading files in that subtree, and `.local.md` variants for uncommitted overrides.

Best practices include being specific ("Use 2-space indentation" beats "Format code properly"), using structured markdown with bullet points grouped under descriptive headings, reviewing periodically as projects evolve, and importing external files via `@./docs/coding-standards.md` syntax (max 5 hops for recursive imports).

### Hooks system for deterministic control

Claude Code hooks are "user-defined shell commands that execute at various points in Claude Code's lifecycle—deterministic control ensuring certain actions always happen rather than relying on the LLM to choose to run them."

Key hook events include **PreToolUse** (runs before tool execution, can block), **PostToolUse** (runs after tool completion—ideal for auto-formatting with prettier/gofmt), **Stop/SubagentStop** (control whether Claude must continue), and **Notification** (custom notification handling).

Production use cases: automatic formatting after file edits, logging executed commands for compliance, blocking modifications to production files, and providing automated feedback on convention violations.

### Custom subagents

Subagents are defined in `.claude/agents/` with frontmatter specifying name, description, tools (optional—inherits all if omitted), and model. Anthropic recommends starting with Claude-generated agents then iterating, limiting tool access to only what's necessary, using proactive phrases like "Use proactively for..." in descriptions to encourage automatic delegation, and version-controlling project subagents.

**Important constraint**: "Subagents cannot spawn other subagents"—this prevents infinite nesting.

---

## Critical anti-patterns and failure modes

### The UC Berkeley MAST taxonomy of failures

Research analyzing 1,600+ traces across 7 frameworks identified **14 distinct failure modes in 3 categories**:

**Specification and system design failures (48%)** include task specification violations (outputs don't match requirements), role specification non-adherence (agents assuming other agents' roles), losing track of assigned roles mid-execution, losing conversation history, and ambiguous initial goals.

**Inter-agent misalignment (28%)** includes duplicate work (multiple agents re-analyzing same data), infinite loops (repeatedly attempting same subtask without awareness of prior attempts), information withholding (failing to pass critical information to peers), failure to seek clarification (proceeding with incorrect assumptions), and format incompatibility (planner outputs YAML but executor expects JSON).

**Task verification and termination failures (24%)** include premature task termination (declaring completion without verification), inadequate verification (checking if code compiles but not if it works correctly), and missing verification steps entirely.

### Context bloat sources

The most common context management anti-patterns include irrelevant rules/instructions (including backend instructions for frontend tasks), MCP server tool definitions (a single Playwright MCP server consumes **~11.7k tokens** just for tool definitions), reusing chat sessions for unrelated tasks, unbounded tool outputs (keyword searches returning hundreds of results), and conversation history growth in stateless LLM interactions.

### Over-engineering patterns to avoid

Multi-agent when single-agent suffices adds coordination overhead for tasks solvable by one agent. Framework complexity introduces new failure points without guaranteeing better results. Premature abstraction creates unnecessary layers, extra files, or overly complex patterns. Too many tools in context when they won't be needed wastes context space.

**Key quote from Anthropic**: "The importance of modular components, such as prompt chaining and routing, rather than adopting overly complex frameworks. Complexity can hinder real-world adoption for agentic systems."

### The "70-30 problem"

As noted by industry practitioners: "For juniors, 70% feels magical. For seniors, the last 30% is often slower than writing it clean from the start." AI-generated code frequently exhibits verbose/redundant tests, lack of reuse (not recognizing existing components), and overly complex implementations (inline CSS instead of classes, unnecessary dependencies).

---

## Validation and observability patterns

### Two-level evaluation approach

Production systems use layered evaluation: **end-to-end evaluation** treating the entire system as a black box and measuring task completion, plus **component-level evaluation** examining individual parts (sub-agents, RAG pipelines, tool calls) to identify where failures occur.

### LLM-as-Judge testing pattern

The dominant pattern uses an LLM to evaluate outputs across three categories: semantic distance (how similar is actual vs expected output?), groundedness (did agent retrieve right context and use it correctly?), and tool usage (did agent use right tools in right way?).

Monte Carlo's production lessons: scores 0.5-0.8 are "soft failures" that can merge (only hard failures <0.5 should block), ~1 in 10 tests produces spurious results requiring auto-retry mechanisms, every LLM judge must provide reasoning not just scores, and tests should be localized rather than spinning up entire agent for one LLM call.

### Structured tracing with OpenTelemetry

The industry is converging on OpenTelemetry semantic conventions for AI agent observability. Key concepts include **traces** (complete request-response cycles), **spans** (individual steps within traces—LLM calls, retrievals, tool usage), and **sessions** (grouping traces for multi-turn interactions).

Per-LLM-call logging should capture exact prompt, model response, token usage, latency, model name/version, and parameters. Per-agent-step logging should capture tool calls and parameters, decision branches taken, error states and retries, and handoffs between agents.

### Quality gates for AI-generated code

Production tools implement multiple enforcement layers: CodeQL analysis for security vulnerabilities, dependency scanning against advisory databases, secret scanning for exposed credentials, automated code review for quality issues, and self-remediation (attempting to fix detected issues before PR completion).

---

## Framework alignment checklist

Based on this research, evaluate any SDD/TAC framework against these industry-validated patterns:

### Context engineering
- [ ] Implements compaction strategy for long-horizon tasks
- [ ] Supports structured note-taking (external memory files)
- [ ] Uses sub-agent architectures for context isolation
- [ ] Avoids context bloat from tool definitions and unbounded outputs
- [ ] CLAUDE.md or equivalent for project-specific context

### Multi-agent orchestration
- [ ] Clear supervisor/orchestrator pattern or justified alternative
- [ ] Subagent-as-tool pattern with explicit context control
- [ ] Prevents infinite agent nesting
- [ ] Structured communication protocols (not free-form)
- [ ] Independent verification agents with separate context

### Specification and planning
- [ ] Explicit spec phase capturing requirements before implementation
- [ ] Tasks broken into small, verifiable chunks
- [ ] Plan persisted to file as checkpoint before code changes
- [ ] Verification steps for each task completion

### Validation and quality
- [ ] Two-level evaluation (end-to-end + component)
- [ ] Deterministic checks (format, guardrails) plus semantic evaluation
- [ ] Pre-commit hooks for automated enforcement
- [ ] Session/trace logging with hierarchical structure
- [ ] Soft failure thresholds (not just pass/fail)

### Anti-pattern avoidance
- [ ] Simplest solution that works (not over-engineered)
- [ ] Clear role boundaries preventing agent role drift
- [ ] Iteration limits preventing infinite loops
- [ ] Result filtering/summarization from subagents
- [ ] Human oversight checkpoints for high-stakes changes

---

## Conclusion

The research reveals a consistent theme across Anthropic's official guidance and industry practice: **successful agentic coding frameworks are defined more by what they avoid than what they include**. The highest-performing systems maintain strict context hygiene, implement clean orchestration boundaries, verify task completion independently, and resist the temptation to add complexity.

The most counterintuitive finding is that multi-agent systems often fail not from model limitations but from coordination breakdowns—the same organizational challenges that plague human teams. Treating agents like distributed systems (enforcing contracts, monitoring behavior, designing for failure) produces better outcomes than assuming agents will figure things out through emergent intelligence.

For framework evaluation, the critical questions are: Does it maintain context as a finite resource with diminishing returns? Does it implement verification independently from production? Does it prevent rather than just detect infinite loops and role drift? And most fundamentally—is the complexity justified by the task value, or would simpler approaches suffice?