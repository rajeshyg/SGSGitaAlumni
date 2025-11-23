# Module 4: Implementation Techniques & Tool Selection

[← Previous: Context & Orchestration](./03-context-and-orchestration.md) | [Back to Guide](./README.md) | [Next: Advanced Patterns →](./05-advanced-patterns.md)

---

## Implementation Techniques

### Technique 1: Scout-Plan-Build Workflow

**When to Use**: Complex features requiring codebase analysis

**Steps**:

#### 1. Scout Phase (Token-Efficient Discovery)
```markdown
# scout-prompt.md
You are a codebase scout for authentication features.

## Workflow
1. Search for files matching: auth*, login*, session*, jwt*, oauth*
2. Read each file's first 50 lines and last 20 lines
3. Identify:
   - Entry points (routes, controllers)
   - Configuration files
   - Test files
   - Related utilities
4. Create a file map with descriptions

## Output (JSON)
{
  "entry_points": ["src/routes/auth.ts"],
  "config": ["config/auth.yaml"],
  "core_logic": ["src/services/auth-service.ts"],
  "tests": ["tests/auth.test.ts"],
  "utilities": ["src/utils/jwt.ts"]
}
```

#### 2. Plan Phase (Architectural Design)
```markdown
# planner-prompt.md
You are a senior architect planning an OAuth implementation.

## Input
- Scout findings: {{ scout_output.json }}
- Specification: {{ spec/oauth.md }}
- Constitution: {{ constitution.md }}

## Workflow
1. Review the current authentication architecture
2. Identify integration points for OAuth
3. Design the data model changes
4. Plan the migration strategy
5. Define the testing approach
6. Document risks and dependencies

## Output
Create implementation_plan.md with:
- Architecture diagrams (mermaid syntax)
- Step-by-step implementation phases
- Database migration scripts
- Testing strategy
- Rollback procedure
```

#### 3. Build Phase (Focused Execution)
```markdown
# builder-prompt.md
You are implementing Phase 2 of the OAuth plan.

## Context
- Implementation plan: {{ implementation_plan.md }}
- Files to modify: {{ planner_output.files }}
- Current phase: OAuth token handling

## Workflow
1. Read the relevant files identified in the plan
2. Implement OAuth token generation using jose library
3. Add token validation middleware
4. Update existing routes to use new middleware
5. Write comprehensive unit tests
6. Update API documentation

## Constraints
- Do not modify database schema (already done in Phase 1)
- Follow error handling patterns from auth-service.ts
- Maintain backward compatibility with session auth
- All new code must have JSDoc comments

## Output
- Modified files with clear comments
- New test file with 90%+ coverage
- Updated API documentation section
```

---

### Technique 2: Specification Priming Pattern

Instead of relying on chat history, inject the spec into each request:

```markdown
# Your workflow script

# 1. Generate or load the spec
spec_content=$(cat specs/feature-x.md)

# 2. Create a primed prompt
cat > primed_prompt.md << EOF
# Context
$spec_content

# Current Task
Implement the user input validation component described in the spec above.

# Instructions
- Follow the validation rules in the Requirements section
- Use the error messages specified in the spec
- Write tests covering all validation scenarios
EOF

# 3. Send to AI assistant
claude -f primed_prompt.md
```

---

### Technique 3: Diff-Driven Review

Make changes reviewable by generating structured diffs:

```markdown
# review-request-prompt.md
I've implemented the feature according to the spec.

Please generate a review document with:

1. **Changes Summary**
   - Files modified: [list]
   - Files added: [list]
   - Total lines changed: [number]

2. **Spec Compliance Check**
   For each requirement in spec/feature-x.md:
   - [Requirement ID]: Implemented / Partial / Not implemented
   - Evidence: [file:line references]

3. **Code Quality Analysis**
   - Test coverage: [percentage]
   - Documentation completeness: [assessment]
   - Performance considerations: [notes]
   - Security review: [concerns if any]

4. **Diff Highlights**
   Show the 5 most important code changes with before/after context.

5. **Recommendations**
   - Issues to address: [list]
   - Suggested improvements: [list]

Output as review_report.md
```

---

### Technique 4: Iterative Refinement Loop

```bash
#!/bin/bash
# refinement-loop.sh

iteration=1
max_iterations=5

while [ $iteration -le $max_iterations ]; do
  echo "=== Iteration $iteration ==="
  
  # Generate code
  claude -f prompts/implement.md > output/iteration_$iteration.txt
  
  # Run tests
  npm test > output/test_results_$iteration.txt
  test_exit=$?
  
  if [ $test_exit -eq 0 ]; then
    echo "All tests passed!"
    break
  fi
  
  # Generate refinement prompt
  cat > prompts/refine.md << EOF
Previous implementation failed tests.

Test Results:
$(cat output/test_results_$iteration.txt)

Please:
1. Analyze the test failures
2. Identify the root cause
3. Fix the implementation
4. Explain what you changed and why
EOF
  
  iteration=$((iteration + 1))
done
```

---

### Technique 5: Template-Based Generation

Create templates for common patterns:

```markdown
# templates/api-endpoint.md
# API Endpoint Specification Template

## Endpoint
- **Method**: {{ method }}
- **Path**: {{ path }}
- **Description**: {{ description }}

## Request
### Headers
- Content-Type: application/json
- Authorization: Bearer {{ token }}

### Body Schema
```json
{{ request_schema }}
```

## Response
### Success (200)
```json
{{ success_schema }}
```

### Error (4xx/5xx)
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Implementation Checklist
- [ ] Input validation using Zod
- [ ] Authentication middleware
- [ ] Authorization checks
- [ ] Error handling
- [ ] Logging
- [ ] Rate limiting
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] OpenAPI documentation
```

**Use with variable substitution:**
```bash
# Generate spec from template
jinja2 templates/api-endpoint.md \
  --var method=POST \
  --var path=/api/users/:id/profile \
  --var description="Update user profile" \
  > specs/update-profile-endpoint.md

# Then use with AI
claude -f specs/update-profile-endpoint.md
```

---

## Tool Selection Guide

### Platform-Agnostic Principles

The spec-driven approach works with any AI coding assistant. Choose based on:

1. **Team Size**: Individual vs. team vs. enterprise
2. **Use Case**: Greenfield vs. brownfield, simple vs. complex
3. **Integration Needs**: Existing tools and workflows
4. **Budget**: Cost per developer, API costs

### Tool Categories

#### Category 1: AI-Native IDEs (Fully Integrated)

**Cursor** ($20/month)
- **Strengths**: Fast iteration, built-in chat, strong community
- **Best For**: Individual developers, rapid prototyping
- **Spec Support**: Via composer and .cursorrules files
- **SDD Integration**: Good - can load specs via .cursorrules

**Windsurf by Codeium** (Free tier available)
- **Strengths**: Cascade agent, context awareness, Memories feature
- **Best For**: Teams wanting free option, long-term projects
- **Spec Support**: Built-in flows, custom instructions
- **SDD Integration**: Excellent - Memories feature aligns with constitution pattern

**AWS Kiro** (Enterprise)
- **Strengths**: Specify → Plan → Execute workflow, AWS integration
- **Best For**: Enterprise teams, brownfield projects, AWS users
- **Spec Support**: Native 3-phase workflow
- **SDD Integration**: Excellent - built specifically for spec-driven approach

#### Category 2: Command-Line Tools (Agentic)

**Claude Code** (API costs)
- **Strengths**: Long context, autonomous operation, Git integration
- **Best For**: Complex tasks, multi-step workflows, automation
- **Spec Support**: Custom slash commands, system prompts
- **SDD Integration**: Excellent - can implement full orchestration

**GitHub Spec Kit** (Open source)
- **Strengths**: Reference implementation, open source, extensible
- **Best For**: Learning, customization, CI/CD integration
- **Spec Support**: Native Constitution → Spec → Plan → Tasks workflow
- **SDD Integration**: Perfect - purpose-built for SDD

**Gemini CLI** (API costs)
- **Strengths**: Fast, Google ecosystem integration
- **Best For**: Teams using Google Cloud, quick iterations
- **Spec Support**: Via custom prompts and scripts
- **SDD Integration**: Good - requires custom setup

#### Category 3: IDE Extensions (Integrated)

**GitHub Copilot** ($19-39/month)
- **Strengths**: Market leader, 33% acceptance rate, wide IDE support
- **Best For**: Teams starting with AI, VS Code users
- **Spec Support**: copilot-instructions.md, custom agents
- **SDD Integration**: Good - copilot-instructions.md for constitution

**Qodo (formerly CodiumAI)** (Free + paid)
- **Strengths**: Multi-agent (Gen, Merge, Cover), quality focus
- **Best For**: Teams prioritizing code quality and review
- **Spec Support**: Integrate via PR workflow
- **SDD Integration**: Moderate - best for review phase

#### Category 4: Specialized Tools

**Tessl Framework** (Beta)
- **Strengths**: Spec-as-source approach, MCP server
- **Best For**: Experimental teams, spec-centric workflows
- **Spec Support**: Native spec-to-code generation
- **SDD Integration**: Excellent - Level 3 SDD (Spec-as-Source)

**HumanLayer** (Enterprise)
- **Strengths**: Human-in-the-loop, compliance, audit trails
- **Best For**: Regulated industries, high-compliance needs
- **Spec Support**: Approval workflows at each phase
- **SDD Integration**: Excellent - adds governance to SDD workflow

---

## Recommended Stack by Use Case

### Solo Developer, Greenfield Project
**Primary**: Cursor or Windsurf
**Supplement**: GitHub Copilot for IDE integration
**Approach**: Level 1 SDD (Documentation-first)

**Setup**:
```markdown
# .cursorrules or .windsurfrules
Load constitution.md on startup
Reference specs/ directory for all implementations
Use Input-Workflow-Output pattern
```

---

### Small Team, Existing Codebase
**Primary**: GitHub Copilot + Spec Kit
**Secondary**: Claude Code for complex refactors
**Approach**: Level 2 SDD (Spec-anchored)

**Setup**:
```markdown
# .github/copilot-instructions.md
1. Always reference specs/ for features
2. Follow patterns in constitution.md
3. Update specs when implementation changes
4. Generate tests for all code

# CI/CD Integration
- Validate spec-code alignment in pre-commit
- Run spec kit validation in CI
```

---

### Enterprise, Brownfield Systems
**Primary**: AWS Kiro or HumanLayer
**Secondary**: GitHub Copilot for daily coding
**Tertiary**: Qodo for code review
**Approach**: Level 2 SDD with strict governance

**Setup**:
```markdown
# Governance Workflow
1. Spec written and approved (human review)
2. Plan generated by Kiro (human approval)
3. Implementation by Copilot (automated tests)
4. Review by Qodo (human approval)
5. Deployment with audit trail (HumanLayer)
```

---

### Advanced Agentic Engineering
**Primary**: Claude Code for orchestration
**Secondary**: Multiple models via API (GPT-4, Gemini, Claude)
**Tertiary**: Custom orchestration layer
**Approach**: Level 3 SDD with multi-agent systems

**Setup**:
```bash
# Custom orchestration script
# orchestrate.sh

# Phase 1: Scout (Haiku - cheap)
claude-haiku scout-codebase.md > scout_output.json

# Phase 2: Plan (Sonnet - thorough)
claude-sonnet plan-implementation.md \
  --input scout_output.json \
  > implementation_plan.md

# Phase 3: Build (Parallel - Sonnet)
claude-sonnet build-backend.md --input implementation_plan.md &
claude-sonnet build-frontend.md --input implementation_plan.md &
wait

# Phase 4: QA (GPT-4 - different perspective)
gpt-4 review-implementation.md \
  --input implementation_plan.md \
  > qa_report.md
```

---

## Tool Integration Examples

### Cursor Integration

```markdown
# .cursorrules

# Load Constitution
{{docs/constitution.md}}

# Always follow this workflow:
1. Check if spec exists in docs/specs/
2. If no spec, ask user to create one first
3. If spec exists, implement according to spec
4. Generate tests covering all requirements
5. Update documentation

# Code Style
- TypeScript strict mode
- Functional programming preferred
- No console.log (use logger)

# File Organization
- Specs: docs/specs/
- Implementation: src/
- Tests: tests/
```

### GitHub Copilot Integration

```markdown
# .github/copilot-instructions.md

# Project Context
This is a spec-driven development project.

# Before Coding
1. Look for specification in docs/specs/
2. Review constitution in docs/constitution.md
3. Check existing patterns in the codebase

# When Implementing
- Follow the spec exactly
- Add tests for all new code
- Use existing patterns and utilities
- Document complex logic

# File Patterns
- All API routes must have Zod validation
- All async functions must have error handling
- All components must have TypeScript types
```

### Claude Code Integration

```bash
# Custom slash command: /prime-spec

#!/bin/bash
# .claude/commands/prime-spec.sh

SPEC_NAME=$1

if [ -z "$SPEC_NAME" ]; then
  echo "Usage: /prime-spec <feature-name>"
  exit 1
fi

SPEC_FILE="docs/specs/$SPEC_NAME.md"

if [ ! -f "$SPEC_FILE" ]; then
  echo "Spec not found: $SPEC_FILE"
  exit 1
fi

# Load constitution + spec
cat docs/constitution.md
echo "---"
cat $SPEC_FILE
echo "---"
echo "Ready to implement $SPEC_NAME"
```

---

## Key Takeaways

1. **Scout-Plan-Build**: Separate discovery, planning, and execution phases
2. **Spec Priming**: Inject specs into prompts, don't rely on chat history
3. **Diff-Driven Review**: Generate structured reviews for code quality
4. **Iterative Refinement**: Use automated loops for test-driven development
5. **Template Library**: Build reusable templates for common patterns
6. **Tool Selection**: Choose based on team size, use case, and budget
7. **Integration**: Leverage tool-specific features for SDD workflow

---

## Next Steps

Learn advanced patterns, ROI analysis, and scaling strategies:

**[Continue to Module 5: Advanced Patterns & ROI Analysis →](./05-advanced-patterns.md)**

Or return to the [main guide](./README.md) to choose a different module.
