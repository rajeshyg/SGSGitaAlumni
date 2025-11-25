# The Unified Agentic Engineering Framework (2025-2026 Edition)

**Based on the Tactical Agentic Coding methodologies of IndyDevDan**

## 1. Executive Summary: The Agentic Shift
We are currently witnessing a paradigm shift from "In-Loop" coding (manual prompting) to "Out-Loop" engineering (managing systems). The constraint on engineering output is no longer your typing speed or individual knowledge, but your ability to command and orchestrate fleets of AI agents.

To survive and thrive in 2026, engineers must transition from writing code to **"building the system that builds the system"**. This requires moving beyond generic, "one-size-fits-all" coding assistants to constructing specialized, domain-specific agentic architectures.

### The Stakeholder Trifecta
Effective prompts and systems are no longer written just for you. They are engineered for three distinct audiences:
1.  **You:** The architect defining the goals.
2.  **Your Team:** Humans who must maintain the system.
3.  **Your Agents:** The digital workforce executing the tasks.

---

## 2. The "Big 3" Super Agent Architecture
The modern "Super Agent" is not a single model, but a composable system leveraging the specific strengths of the three major AI providers. This architecture utilizes a "Model Stack" to optimize for price, performance, and speed.

### A. The Orchestrator Layer (The Manager)
* **Model:** **OpenAI Realtime API** (Voice/Text)
* **Role:** The "Conductor" or Project Manager.
* **Function:** It does not write code. It accepts high-level voice or text commands, breaks them down into plans, and manages the lifecycle of specialized sub-agents.
* **Benefit:** Decouples the engineer from execution details, allowing for high-level "Out-Loop" command.

### B. The Builder Layer (The Specialist)
* **Model:** **Claude Code (Sonnet 4.5 & Haiku 4.5)**
* **Role:** The "Workhorse" for deep coding tasks.
* **Selection Strategy:**
    * **Haiku 4.5:** Used for "Scouting" (file discovery), simple code generation, and documentation. It is ~3x cheaper and significantly faster (100-200 tokens/sec) than Sonnet.
    * **Sonnet 4.5:** Used for complex planning, architecture design, and "heavy-hitting" implementation tasks.
* **Technical Implementation:**
    * Claude Code is programmable via SDK - run it as `claude -p "your prompt" --allowedTools "Write" "Edit"`
    * Use `--model` flag to switch between Sonnet/Haiku: `--model haiku` or `--model sonnet`
    * API costs: ~$3-4 for 5.8M tokens (MVP-level work)

### C. The Validation Layer (The Tester)
* **Model:** **Gemini 2.5 Computer Use** (or **Playwright via MCP**)
* **Role:** End-to-End Testing & QA.
* **Function:** Autonomously controls a browser to physically test the application (e.g., clicking buttons, verifying UI themes) and feeding results back to the Orchestrator.
* **Implementation:** Connect via MCP server: `claude mcp add --transport stdio playwright -- npx @playwright/mcp@latest`

---

## 3. Core Operational Workflow: Scout-Plan-Build
To maintain context hygiene and accuracy, never ask a single agent to do everything. Use the **Scout-Plan-Build** pattern.

### Phase 1: Scout (The "Light" Agents)
* **Goal:** Gather information without polluting the context window of the expensive planner.
* **Action:** Deploy lightweight agents (e.g., Haiku 4.5) to search the codebase, read documentation, and summarize findings.
* **Output:** A concise summary or map of relevant files.
* **Implementation:** `claude --model haiku -p "search codebase for authentication logic and summarize in 200 words"`

### Phase 2: Plan (The "Heavy" Agents)
* **Goal:** Create a deterministic blueprint for execution.
* **Action:** A generic planner agent (Sonnet 4.5) reads the Scout's summary and generates a detailed implementation plan (e.g., a `specs` file).
* **Critical Constraint:** The agent *only* plans; it does not write the final code yet. This allows human review of the architecture before token-heavy coding begins.
* **Pattern:** Store plans as markdown in `/specs` directory for version control and team review.

### Phase 3: Build (The Execution)
* **Goal:** Implement the verified plan.
* **Action:** Specialized "Builder" agents read the `specs` file and execute the code changes.
* **Parallelism:** You can spin up multiple builders (e.g., "Sony" for Backend, "Blink" for Frontend) to work simultaneously using **git worktrees**:
```bash
# Create parallel work environments
git worktree add ../project-backend backend-feature
git worktree add ../project-frontend frontend-feature

# Run agents in parallel directories
cd ../project-backend && claude -p "implement backend per specs.md"
cd ../project-frontend && claude -p "implement frontend per specs.md"
```

### Phase 4: Validate
* **Action:** The Browser Agent (Gemini 2.5 or Playwright MCP) navigates to `localhost`, interacts with the new features, and logs success/failure.

---

## 4. Engineering the Agents: Prompts & Context
Standard "vibe coding" (casual chatting) is deprecated. You must use structured engineering principles.

### A. Prompt Engineering Structure
Every effective agentic prompt should follow this three-step sequence:
1.  **Input:** Define exactly what information is being passed in.
2.  **Workflow:** The most critical section. A step-by-step sequential list of tasks (S-Tier Usefulness).
3.  **Output (Report):** Specify the exact format (JSON, YAML, File Update) required.

**Example Reusable Prompt Template:**
```markdown
## Input
- Codebase summary from Scout agent
- Feature requirements from specs.md

## Workflow
1. Read and parse specs.md file
2. Identify affected files using codebase map
3. Generate implementation plan with file-by-file changes
4. Write code following project style guide
5. Run linter and tests
6. Create git commit with conventional message

## Output
- Modified files with inline comments
- Test coverage report
- Git commit hash
```

### B. Context Engineering: The R&D Framework
The context window is your scarcest resource. Use the **R&D (Reduce & Delegate)** framework to manage it.

* **Reduce (R):**
    * **Context Priming:** Instead of a massive `claude.md` file, use small, purpose-built **slash commands** (e.g., `/prime bug`) to load only relevant context.
    * **MCP Hygiene:** Delete the default `.claude.json` that preloads all tools. Load tools dynamically only when needed.
    * **Implementation:** Edit `.claude.json` directly rather than using CLI wizard:
    ```json
    {
      "mcpServers": {
        "github": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-github"],
          "env": {"GITHUB_TOKEN": "your_token"}
        }
      }
    }
    ```
    * Monitor context usage: Use `/context` command in Claude Code to see token consumption.

* **Delegate (D):**
    * Offload heavy tasks (scraping, reading docs) to sub-agents or background instances.
    * **Context Bundles:** Use sub-agents to process data and return only a summary ("bundle") to the primary agent, saving thousands of tokens.
    * **Subagent Pattern:** Claude Code can spawn subagents automatically for isolated deep dives that prevent context pollution.

---

## 5. Advanced Features: Skills, Hooks, and MCP Integration

### A. Claude Skills (Automatic Context-Driven Behaviors)
* **What:** Skills are markdown files that teach Claude domain-specific knowledge that applies automatically without manual invocation.
* **Location:** Place in `.claude/skills/` directory
* **Example Use Cases:**
    * Where to get US census data and how to structure it
    * How to load data into SQLite/DuckDB using Python
    * Company-specific coding standards and architecture patterns
* **Key Insight:** Skills are "always on" - Claude automatically applies them when relevant to the current task.

### B. Hooks (Automated Quality Gates)
* **What:** Event-driven automation that triggers on specific tool usage (e.g., after Write, before Bash).
* **Use Cases:**
    * Auto-formatting code after writes
    * Running linters before commits
    * Automatically generating tests
* **Implementation:** Define in `.claude/hooks/` directory

### C. MCP Integration Best Practices
* **Universal MCP Approach:** Use Rube or similar universal MCP servers to access multiple toolkits (GitHub, Figma, Linear, Slack) through a single server.
* **Code Execution Pattern:** Instead of loading all MCP tool definitions upfront (expensive), use code execution to interact with MCP servers:
```typescript
// Generate file tree of MCP tools
servers/
├── google-drive/
│   ├── getDocument.ts
│   └── createDocument.ts
└── github/
    ├── createPR.ts
    └── listIssues.ts
```
* **Token Optimization:** This approach loads only needed tools and processes data in execution environment before returning to model.

---

## 6. The Endgame: Custom Agents & Orchestration
To reach the top 1% of engineering output, you must graduate from standard tools to **Custom Agents**.

### The Orchestrator Pattern (O-Agent)
Instead of manually managing individual agents, you build an **Orchestrator Agent** that manages them for you.

* **Single Interface:** You talk only to the O-Agent via voice (using RealtimeSTT + OpenAI TTS).
* **CRUD for Agents:** The O-Agent has permissions to **C**reate, **R**ead, **U**pdate, and **D**elete other agents as "disposable resources".
* **Observability:** A custom UI ("Mission Control") that tracks the logs, costs, and tool calls of your entire agent fleet in real-time.
* **Reference Implementation:** See IndyDevDan's `voice_to_claude_code.py` for voice-enabled orchestration.

### The "Core Four" of Custom Agents
When building these custom agents using the Claude Code SDK, you must control four elements:
1.  **System Prompt:** The absolute authority defining the agent's persona (e.g., "You are a Pong agent").
2.  **User Prompt:** The dynamic task input.
3.  **Tools:** Custom capabilities (e.g., file system access, API calls) - control with `--allowedTools` flag.
4.  **Model Configuration:** Choosing the right model (Haiku vs. Sonnet) for the specific task using `--model` flag.

### Strategy Summary: The PETER Framework
To future-proof your career, progress through these stages:
1.  **In-Loop:** Manual prompting (Deprecated).
2.  **Out-Loop:** You provide the prompt; the agent handles execution and review.
3.  **ZTE (Zero Touch Engineering):** Fully autonomous systems where agents spawn other agents to solve problems while you sleep.

---

## 7. Key Technical Implementation Patterns

### A. Parallel Agent Execution
```bash
# Use git worktrees for true parallel development
git worktree add ../backend-work feature/backend
git worktree add ../frontend-work feature/frontend

# Launch parallel agents
(cd ../backend-work && claude -p "implement API per specs" &)
(cd ../frontend-work && claude -p "implement UI per specs" &)
```

### B. Cost-Optimized Model Selection
* **Haiku for:** Scouting, documentation, simple CRUD operations (~$0.02 per task)
* **Sonnet for:** Architecture design, complex refactoring, debugging (~$3-4 for major features)
* **Decision Rule:** If task requires <500 lines of code or pure information retrieval, use Haiku.

### C. MCP Server Management
```bash
# Add MCP server with proper scoping
claude mcp add --transport stdio github \
  --env GITHUB_TOKEN=your_token \
  --scope /path/to/project \
  -- npx -y @modelcontextprotocol/server-github

# Check connected servers and context usage
claude /mcp
claude /context
```

---

## 8. Production Deployment Checklist

Before shipping agentic systems to production:

1. **Context Monitoring:** Ensure average context usage stays below 80% capacity
2. **Tool Permissions:** Explicitly define `allowedTools` - never use unrestricted access
3. **Cost Guards:** Set daily spending limits on API keys
4. **Logging:** Implement comprehensive logging of all agent actions for audit trails
5. **Human-in-Loop:** Define critical decision points requiring human approval
6. **Rollback Strategy:** Maintain git history and automated rollback procedures
7. **Testing:** Use Playwright/Computer Use agents to validate end-to-end flows before human QA

---

## 9. Common Pitfalls to Avoid

1. **Context Pollution:** Loading massive `claude.md` files with irrelevant info - use targeted priming instead
2. **Over-MCP'ing:** Adding every MCP server upfront - load dynamically as needed
3. **Single Agent Fallacy:** Asking one agent to scout, plan, and build - use specialized roles
4. **Vibe Coding:** Casual back-and-forth chat without structured prompts - formalize your workflow
5. **Manual Tool Management:** Clicking through CLI wizards - edit config files directly
6. **Ignoring Token Economics:** Using Sonnet for everything when Haiku suffices - optimize for cost

---

## 10. Resources & Next Steps

* **IndyDevDan YouTube:** Primary source for tactical patterns and updates
* **Principled AI Coding Course:** Foundation course covering Model, Prompt, Context framework
* **Tactical Agentic Coding Course:** Advanced orchestration and production patterns
* **GitHub Reference Repos:**
    * `claude-code-is-programmable`: SDK examples in Python/JavaScript
    * `indydevtools`: Multi-agent toolbox with reusable functions
* **Community:** Join Discord/forums to share patterns and stay updated on ecosystem changes

---

**Final Note:** The agentic engineering landscape evolves rapidly. This framework provides timeless principles (Model-Prompt-Context, Scout-Plan-Build, R&D) that adapt to new tools while specific implementations (model names, API endpoints) will change. Focus on mastering the principles, not memorizing the tools.