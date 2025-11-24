# Claude Code Context

**Auto-loaded context**: `docs/specs/context/always-on.md`

This provides essential project information, SDD framework guidance, and how to trigger agents.

---

## Available Context Priming Commands

Use these slash commands to load specific context before starting work:

- `/prime-auth` — Authentication patterns and OTP flow
- `/prime-api` — API endpoint standards and response formats
- `/prime-database` — Database connection and query patterns
- `/prime-ui` — UI components, theme system, and styling standards
- `/prime-specs [feature-name]` — Load specific feature specification

---

## Quick Reference

**Starting a task?**
1. You have always-on.md already loaded ✅
2. Request `/prime-[domain]` if you need pattern examples
3. For complex features, use Scout-Plan-Build workflow
4. Read Module 6 for detailed agent orchestration: `docs/spec-driven-development/06-agent-orchestration-implementation.md`

**Agent triggering examples:**
- `Use Task tool with subagent_type=Explore to scout [feature]`
- `Run 3 parallel Task agents to scout Frontend, Backend, and Database simultaneously`
- `Create an Orchestrator agent to coordinate Scout-Plan-Build phases`

---

See `docs/specs/context/always-on.md` for complete guidance on how to work with this project.
