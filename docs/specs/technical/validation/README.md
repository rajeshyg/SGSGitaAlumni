---
version: 1.0
status: partial
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Multi-layer validation framework for quality gates
---

# Validation Framework

## Overview

**Purpose**: Catch issues at the right time - development → pre-tool-use → pre-commit → CI/CD

**Philosophy**: Shift left - catch errors as early as possible

---

## Validation Layers

| Layer | When | Tool | Purpose |
|-------|------|------|---------|
| **Real-Time** | During development | Claude hooks (planned) | Before AI makes changes |
| **Pre-Commit** | Before git commit | Husky hooks | Last line of defense |
| **CI/CD** | On push | GitHub Actions | Final verification |
| **Audit** | On-demand | Validation scripts | Generate reports |

---

## Current Implementation

### Pre-Commit Validation (Implemented)

**Location**: `.husky/pre-commit`

**Runs**:
1. Project structure validation
2. Documentation validation
3. ES Lint checks
4. Redundancy detection
5. Mock data detection

**Scripts Used**:
- `scripts/validation/check-redundancy.js`
- `scripts/validation/detect-mock-data.js`
- `scripts/core/check-documentation.js`

### Real-Time Validation (Planned)

**Location**: `.claude/hooks/pre-tool-use.sh` *(planned)*

**Will Run**: Before AI uses Write/Edit/Bash tools

**Purpose**: Catch issues BEFORE code is written (not at commit time)

**Benefits**:
- Immediate feedback to AI
- Prevents wasted tokens on invalid approaches
- Enforces standards proactively

---

## Validation Scripts Catalog

### Framework Validation
| Script | Purpose | Location |
|--------|---------|----------|
| `check-redundancy.js` | Detect duplicate files | `scripts/validation/` |
| `detect-mock-data.js` | Find mock data in code | `scripts/core/` |
| `validate-structure.cjs` | Project structure compliance | `scripts/core/` |
| `audit-framework.cjs` | Framework implementation audit | `scripts/validation/` |

### Code Quality
| Script | Purpose | Location |
|--------|---------|----------|
| `audit-code-quality.cjs` | Code quality metrics | `scripts/validation/` |
| `audit-documentation.cjs` | Documentation completeness | `scripts/validation/` |
| `check-documentation.js` | Doc standards compliance | `scripts/core/` |

---

## Integration Points

### Skills Integration
Skills auto-activate to enforce patterns:
- `duplication-prevention.md` → Runs before file creation
- `security-rules.md` → Runs for auth/database/API code
- `coding-standards.md` → Runs for service/database code

### Hooks Integration (Planned)
Claude hooks will reuse validation scripts:
```bash
# .claude/hooks/pre-tool-use.sh
# Before Write/Edit tools
→ Run check-redundancy.js
→ Run validate-sql-query.js
→ Run check-security-pattern.js
```

### Pre-Commit Integration
Git hooks run validation before commit:
```bash
# .husky/pre-commit
→ npm run validate:structure
→ npm run validate:docs
→ npm run lint
→ node scripts/validation/check-redundancy.js
→ node scripts/core/detect-mock-data.js
```

---

## Next Steps

1. **Implement Real-Time Validation** (TIER 1 priority)
   - Create `.claude/hooks/pre-tool-use.sh`
   - Create validation scripts in `scripts/validation/hooks/`
   - Integrate with existing validation scripts

2. **Enhance Pre-Commit** (TIER 2)
   - Add security pattern checks
   - Add N+1 query detection
   - Add service size validation

3. **CI/CD Integration** (TIER 3)
   - Run all validations on GitHub Actions
   - Block merges on validation failures

---

## Spec Documents

| Document | Purpose |
|----------|---------|
| [pre-commit-validation.md](./pre-commit-validation.md) | Git pre-commit hooks reference |
| [real-time-validation.md](./real-time-validation.md) | Claude hooks integration (planned) |
| [validation-scripts.md](./validation-scripts.md) | Script catalog and usage |

---

**See Also**:
- [Development Framework](../development-framework/) - Uses these validations
- [Coding Standards](../coding-standards/) - Standards enforced by validation
- [Security](../security/) - Security patterns validated
