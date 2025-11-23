# Spec-Driven Development Guide

## Overview

This modular guide provides a comprehensive methodology for spec-driven development (SDD) with AI coding assistants. The guide is split into focused modules for efficient context management and easier navigation.

**Core Philosophy**: Specifications are the new source code. Well-crafted specs act as force multipliers, while the AI handles implementation details. You architect and validate; the AI executes.

## Module Structure

This guide is organized into five core modules, each focusing on specific aspects of spec-driven development:

### [Module 1: Understanding Spec-Driven Development](./01-understanding-sdd.md)
**Topics Covered:**
- What is Spec-Driven Development?
- Three paradigms: Spec-First, Spec-Anchored, Spec-as-Source
- Benefits over "vibe coding"
- Three levels of SDD implementation
- Core framework: Constitution-Spec-Plan-Tasks

**When to Read**: Start here for foundational concepts and the four-phase workflow.

### [Module 2: Agentic Prompt Engineering](./02-agentic-patterns.md)
**Topics Covered:**
- Input-Workflow-Output pattern
- Progressive complexity levels (Simple, Control Flow, Delegation)
- Composable prompt sections
- Reusable prompt libraries

**When to Read**: After understanding SDD basics, learn how to write effective AI prompts.

### [Module 3: Context Engineering & Multi-Agent Systems](./03-context-and-orchestration.md)
**Topics Covered:**
- Reduce & Delegate framework
- Strategic tool management
- Context priming techniques
- Multi-agent orchestration patterns
- Scout-Plan-Build workflow
- Observability dashboards

**When to Read**: When scaling beyond single-agent tasks to complex workflows.

### [Module 4: Implementation Techniques & Tools](./04-implementation-techniques.md)
**Topics Covered:**
- Scout-Plan-Build workflow
- Specification priming pattern
- Diff-driven review
- Iterative refinement loops
- Template-based generation
- Tool selection guide (Cursor, Windsurf, Claude Code, etc.)

**When to Read**: When ready to implement SDD in your daily workflow.

### [Module 5: Advanced Patterns & ROI Analysis](./05-advanced-patterns.md)
**Topics Covered:**
- Model stack strategy
- Closed-loop feedback systems
- Parallel agent execution
- Specification evolution workflow
- Human-in-the-loop decision points
- Progressive enhancement strategy
- Test-driven specifications
- Effort analysis and ROI calculations

**When to Read**: For optimization, scaling, and measuring the impact of SDD adoption.

## Quick Start

**New to SDD?** Start with [Module 1](./01-understanding-sdd.md) to understand the fundamentals.

**Ready to implement?** Jump to [Module 4](./04-implementation-techniques.md) for practical techniques and tool selection.

**Scaling up?** Review [Module 5](./05-advanced-patterns.md) for advanced patterns and ROI analysis.

## How to Use This Guide

1. **Linear Learning**: Read modules 1-5 in order for comprehensive understanding
2. **Task-Focused**: Jump to specific modules based on your current need
3. **Reference**: Use as a handbook when implementing specific patterns
4. **Team Onboarding**: Share relevant modules with team members based on their role

## Key Principles

Across all modules, these principles remain constant:

- **Specs are the primary artifact** - Code is generated from them
- **Context management is critical** - Use the R&D framework (Reduce & Delegate)
- **Start simple, scale progressively** - Level 1 → Level 2 → Level 3
- **Validate continuously** - Closed-loop feedback at every step
- **Choose the right tool** - Match model capability to task complexity
- **Measure and optimize** - Track productivity gains and costs

## Architecture Levels

**Level 1: Documentation-First** (Weeks 1-2)
- Write specs as documentation
- Use specs to guide AI coding
- Suitable for greenfield projects
- **ROI**: 20-30% productivity gain

**Level 2: Specification-Anchored** (Weeks 3-8)
- Specs evolve with codebase
- Used for maintenance and onboarding
- Supports brownfield projects
- **ROI**: 2-3x productivity gain

**Level 3: Specification-as-Source** (Months 3-6)
- Specs are the source; code is fully generated
- Code marked "DO NOT EDIT"
- Experimental but promising
- **ROI**: 5-10x productivity gain

## Templates and Resources

Each module includes practical templates and examples:
- Constitution templates
- Feature specification templates
- Implementation plan templates
- Task breakdown templates
- Prompt engineering patterns
- Tool-specific integrations

## Learning Path

```
Start Here
    ↓
Module 1: Learn SDD Fundamentals (2-3 hours)
    ↓
Module 2: Master Prompt Engineering (2-3 hours)
    ↓
Implement Level 1 SDD (1-2 weeks)
    ↓
Module 3: Context & Orchestration (2-3 hours)
    ↓
Module 4: Implementation Techniques (2-3 hours)
    ↓
Implement Level 2 SDD (4-8 weeks)
    ↓
Module 5: Advanced Patterns & Scale (3-4 hours)
    ↓
Implement Level 3 SDD (3-6 months)
```

## Support and Updates

This guide is a living document. As SDD practices evolve and new tools emerge, modules will be updated to reflect best practices.

**Version**: 2.0 (Modular Structure)
**Last Updated**: 2025-01-XX
**Original Guide**: docs/archive/spec_driven_coding_guide.md

---

**Ready to begin?** Start with [Module 1: Understanding Spec-Driven Development](./01-understanding-sdd.md)
