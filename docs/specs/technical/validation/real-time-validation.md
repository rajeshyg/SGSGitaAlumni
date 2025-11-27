---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Real-Time Validation (Claude Hooks)

```yaml
---
version: 1.0
status: planned
last_updated: 2025-11-26
applies_to: all
enforcement: recommended
description: Claude hooks that validate BEFORE AI makes changes (shift-left validation)
implementation: .claude/hooks/pre-tool-use.sh
---
```

## Overview

**Purpose**: Catch issues BEFORE code is written (not at commit time)

**Location**: `.claude/hooks/pre-tool-use.sh` *(planned - TIER 1 priority)*

**Benefit**: Immediate feedback to AI, prevents wasted tokens, enforces standards proactively

---

## Why Real-Time Validation?

### Current Problem
```
AI writes code → Pre-commit fails → AI fixes → Pre-commit fails → repeat
```
**Waste**: 3-5 iterations, hundreds of tokens, time delays

### With Real-Time Validation
```
AI attempts → Hook blocks → AI tries different approach → Success
```
**Benefit**: One iteration, immediate feedback, no wasted commits

---

## Hook Types

### Pre-Tool-Use Hook
**Triggers**: Before Write, Edit, Bash tools

**Use Cases**:
1. Before creating files → Check for duplicates
2. Before SQL queries → Validate parameterization
3. Before auth code → Check security patterns
4. Before service files → Check size limits

**Exit Code 2**: Blocks the tool call entirely

### Post-Tool-Use Hook
**Triggers**: After Write, Edit tools

**Use Cases**:
1. After file creation → Validate structure
2. After connection code → Check try/finally
3. After queries → Check for N+1 patterns

**Exit Code 2**: Shows error to Claude, forces fix

---

## Planned Implementation

### Structure
```
scripts/validation/hooks/
├── pre-tool-use/
│   ├── check-file-duplication.js      # Before creating files
│   ├── validate-sql-query.js          # Before database operations
│   ├── check-security-pattern.js      # Before auth/API changes
│   └── validate-service-size.js       # Before service modifications
│
└── post-tool-use/
    ├── validate-connection-cleanup.js # After connection code
    └── check-n-plus-one-queries.js    # After queries written
```

### Hook Script (.claude/hooks/pre-tool-use.sh)
```bash
#!/bin/bash
# Pre-Tool-Use Hook - Validate before AI makes changes

TOOL_NAME="$1"
PARAMS="$2"

case "$TOOL_NAME" in
  "Write"|"Edit")
    FILE_PATH=$(echo "$PARAMS" | jq -r '.file_path')

    # Check for duplicates before creating/editing files
    node scripts/validation/hooks/pre-tool-use/check-file-duplication.js "$FILE_PATH"
    if [ $? -eq 2 ]; then
      echo "❌ BLOCKED: Similar file exists. Search codebase first."
      exit 2  # Exit code 2 blocks the tool call
    fi

    # For database files, check SQL patterns
    if [[ "$FILE_PATH" == *"routes/"* ]] || [[ "$FILE_PATH" == *"services/"* ]]; then
      node scripts/validation/hooks/pre-tool-use/validate-sql-query.js "$PARAMS"
      if [ $? -eq 2 ]; then
        echo "❌ BLOCKED: SQL injection risk detected. Use parameterized queries."
        exit 2
      fi
    fi

    # For service files, check size limits
    if [[ "$FILE_PATH" == *"services/"* ]]; then
      node scripts/validation/hooks/pre-tool-use/validate-service-size.js "$FILE_PATH"
      if [ $? -eq 2 ]; then
        echo "⚠️ WARNING: Service file approaching 300-line limit. Consider splitting."
        # Exit 0 to allow, just warn
      fi
    fi
    ;;

  "Bash")
    COMMAND=$(echo "$PARAMS" | jq -r '.command')

    # Block dangerous commands
    if [[ "$COMMAND" =~ rm.*-rf ]] || [[ "$COMMAND" =~ sudo.*rm ]]; then
      echo "❌ BLOCKED: Dangerous command detected"
      exit 2
    fi
    ;;
esac

exit 0  # Allow the tool call
```

---

## Validation Scripts

### check-file-duplication.js
```javascript
// Check if similar file already exists before creating new one
// Reuses logic from scripts/validation/check-redundancy.js
// Exit 2 if duplicate found, 0 if safe to create
```

### validate-sql-query.js
```javascript
// Extract SQL from code being written
// Check for string concatenation patterns
// Exit 2 if SQL injection risk, 0 if parameterized
```

### check-security-pattern.js
```javascript
// Scan for security anti-patterns:
// - Logging tokens/passwords/OTPs
// - Trusting client claims without verification
// - Missing rate limiting on auth endpoints
// Exit 2 if violation found
```

### validate-service-size.js
```javascript
// Count lines in service file
// Warn if approaching 300 lines
// Exit 2 if exceeds 300 lines (force split)
```

---

## Integration with Existing Validations

### Reuse Validation Scripts
```
Pre-Tool-Use Hooks (real-time)
  ↓
  Reuse same scripts as
  ↓
Pre-Commit Hooks (final gate)
```

**Benefit**: Single source of truth for validation logic

### Skills + Hooks Synergy
```
Skills (guide AI proactively)
  +
Hooks (enforce deterministically)
  =
High-quality code without iteration
```

---

## Benefits

| Aspect | Before Hooks | With Hooks |
|--------|-------------|------------|
| **Iterations** | 3-5 tries | 1 try |
| **Tokens wasted** | Hundreds | None |
| **Commit history** | Messy (fix-on-fix) | Clean |
| **Developer time** | Review + ask for fixes | Auto-enforced |

---

## Implementation Priority

**TIER 1** (This week):
1. Create `.claude/hooks/pre-tool-use.sh`
2. Implement `check-file-duplication.js`
3. Implement `validate-sql-query.js`
4. Test with sample feature

**TIER 2** (This month):
1. Implement `check-security-pattern.js`
2. Implement post-tool-use validations
3. Add service size validation
4. Add N+1 query detection

---

**Related**:
- [Pre-Commit Validation](./pre-commit-validation.md) - Final quality gate
- [Validation Scripts](./validation-scripts.md) - Script catalog
- [Development Framework](../development-framework/) - Uses these validations
