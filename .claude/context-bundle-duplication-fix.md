# Context Bundle: Dynamic Duplication Prevention Implementation

**Created:** 2025-12-03
**Status:** Ready for execution
**Session ID:** Continuation from duplication testing session

---

## Executive Summary

This context bundle contains all changes needed to complete the dynamic duplication prevention system. The current system has hard-coded patterns that don't scale. This implementation replaces them with registry-based dynamic pattern generation.

**What this fixes:**
- ❌ Hard-coded function names (validateEmail, formatCurrency, etc.)
- ❌ Hard-coded table names (APP_USERS, ALUMNI_MEMBERS, etc.)
- ❌ Hard-coded component names
- ✅ Dynamic loading from `.claude/duplication-registry.json`
- ✅ One-line registry update → automatic protection for all exports
- ✅ Registry doubles as living documentation

---

## Current State Analysis

### What's Already Done ✅
1. **Rulebook locked** - `scripts/validation/rules/exceptions.cjs` updated:
   - Added `.claude/hooks/*.cjs` to LOCKED_FILES
   - Added `.claude/duplication-registry.json` to LOCKED_FILES
   - Added `.claude/skills/duplication-prevention.md` to LOCKED_FILES

2. **Registry exists** - `.claude/duplication-registry.json` contains:
   - All database tables (APP_USERS, ALUMNI_MEMBERS, etc.)
   - All utilities (validateEmail, formatCurrency, etc.)
   - All components (Button, Input, Dialog, etc.)
   - All API routes

3. **Edit tool coverage exists** - Lines 341-376 of hook already check Edit operations

### What Needs Implementation 🔄
1. **Replace hard-coded patterns** in `.claude/hooks/pre-tool-use-constraint.cjs`
2. **Verify the system works** with test cases
3. **Add transparency layer** (future enhancement)

---

## Required Changes

### Change 1: Dynamic Pattern Loading in Hook

**File:** `.claude/hooks/pre-tool-use-constraint.cjs`

**Lines to replace:** 99-181

**Find this code block:**
```javascript
/**
 * HIGH-RISK DUPLICATION PATTERNS
 * These patterns indicate likely duplication that should be blocked
 */
const HIGH_RISK_PATTERNS = [
  // Database duplication
  { pattern: /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i, reason: 'Use CREATE TABLE IF NOT EXISTS to prevent duplicate tables' },
  { pattern: /CREATE\s+DATABASE/i, reason: 'Creating new database - check if database already exists' },

  // Schema duplication keywords (in file content)
  { pattern: /user.*table|table.*user/i, filePattern: /\.sql$/i, reason: 'User tables already exist (APP_USERS, ALUMNI_MEMBERS, USER_PROFILES)' },
  { pattern: /email.*valid|valid.*email/i, filePattern: /utils?/i, reason: 'Email validation exists in src/utils/errorHandling.ts' },
];

/**
 * CONTENT-BASED DUPLICATION PATTERNS
 * These check the actual code content being added (works for both Write and Edit)
 */
const CONTENT_DUPLICATION_PATTERNS = [
  // Email validation - check for function definitions
  {
    pattern: /function\s+validateEmail|validateEmail\s*[:=]\s*\(|export\s+.*validateEmail/i,
    existing: 'src/utils/errorHandling.ts',
    what: 'validateEmail function',
    block: true
  },
  {
    pattern: /function\s+sanitizeEmail|sanitizeEmail\s*[:=]\s*\(/i,
    existing: 'src/utils/errorHandling.ts',
    what: 'email sanitization (add to existing errorHandling.ts)',
    block: false
  },
  // Database table creation
  {
    pattern: /CREATE\s+TABLE.*users/i,
    existing: 'APP_USERS table already exists',
    what: 'users table',
    block: true
  },
  // Common utility duplications
  {
    pattern: /function\s+formatDate|formatDate\s*[:=]\s*\(/i,
    existing: 'src/lib/utils.ts or date-fns',
    what: 'formatDate function',
    block: false
  },
  {
    pattern: /function\s+formatCurrency|formatCurrency\s*[:=]\s*\(/i,
    existing: 'src/utils/formatters.ts',
    what: 'formatCurrency function',
    block: false
  },
];

/**
 * KNOWN EXISTING PATTERNS - warn when creating files with these keywords
 */
const EXISTING_PATTERNS = {
  // Utilities
  'email': { existing: 'src/utils/errorHandling.ts', what: 'email validation' },
  'format': { existing: 'src/utils/formatters.ts', what: 'formatting utilities' },
  'valid': { existing: 'src/utils/errorHandling.ts, utils/validation.js', what: 'validation functions' },
  'storage': { existing: 'src/utils/localStorage.ts', what: 'storage utilities' },
  'database': { existing: 'utils/database.js', what: 'database utilities' },

  // Components
  'button': { existing: 'src/components/ui/button.tsx', what: 'Button component' },
  'input': { existing: 'src/components/ui/input.tsx', what: 'Input component' },
  'modal': { existing: 'src/components/ui/dialog.tsx', what: 'Modal/Dialog component' },
  'dialog': { existing: 'src/components/ui/dialog.tsx', what: 'Dialog component' },
  'card': { existing: 'src/components/ui/card.tsx', what: 'Card component' },
  'toast': { existing: 'src/components/ui/toast.tsx', what: 'Toast component' },
  'alert': { existing: 'src/components/ui/alert.tsx', what: 'Alert component' },
  'loading': { existing: 'src/components/shared/', what: 'Loading component' },
  'header': { existing: 'src/components/shared/', what: 'Header component' },
  'footer': { existing: 'src/components/shared/', what: 'Footer component' },
  'login': { existing: 'src/components/auth/LoginForm.tsx', what: 'Login component' },
  'auth': { existing: 'src/components/auth/', what: 'Auth components' },

  // Routes/API
  'auth': { existing: 'routes/auth.js', what: 'Auth API endpoints' },
  'user': { existing: 'routes/users.js', what: 'User API endpoints' },
  'invitation': { existing: 'routes/invitations.js', what: 'Invitation API endpoints' },
  'posting': { existing: 'routes/postings.js', what: 'Postings API endpoints' },
  'chat': { existing: 'routes/chat.js', what: 'Chat API endpoints' },
  'family': { existing: 'routes/family-members.js', what: 'Family API endpoints' },
};
```

**Replace with:**
```javascript
/**
 * DYNAMIC PATTERN LOADER
 * Loads duplication patterns from the central registry
 * This eliminates hard-coded patterns and makes the system scalable
 */
function loadDuplicationPatterns() {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const registryPath = path.join(projectDir, '.claude', 'duplication-registry.json');

    if (!fs.existsSync(registryPath)) {
      return { contentPatterns: [], existingPatterns: {}, highRiskPatterns: [] };
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const contentPatterns = [];
    const existingPatterns = {};
    const highRiskPatterns = [];

    // Generate patterns for utility functions (frontend + backend)
    ['frontend', 'backend'].forEach(type => {
      const utils = registry.utilities?.[type] || {};
      for (const [file, info] of Object.entries(utils)) {
        // Add to existing patterns (file-name based warnings)
        const fileName = path.basename(file, path.extname(file));
        if (fileName && !existingPatterns[fileName]) {
          existingPatterns[fileName] = { existing: file, what: info.purpose || 'utility functions' };
        }

        // Generate content patterns for each export
        (info.exports || []).forEach(exportName => {
          contentPatterns.push({
            pattern: new RegExp(
              `function\\s+${exportName}|${exportName}\\s*[:=]\\s*\\(|export\\s+.*${exportName}`,
              'i'
            ),
            existing: file,
            what: `${exportName} function`,
            block: true
          });
        });
      }
    });

    // Generate patterns for database tables
    const tables = registry.databases?.primary?.tables || {};
    for (const [tableName, tableInfo] of Object.entries(tables)) {
      // Content pattern - catches CREATE TABLE statements
      contentPatterns.push({
        pattern: new RegExp(`CREATE\\s+TABLE.*${tableName}`, 'i'),
        existing: `${tableName} table already exists`,
        what: `${tableName} table`,
        block: true
      });

      // High-risk pattern - catches table references in SQL
      highRiskPatterns.push({
        pattern: new RegExp(`${tableName}`, 'i'),
        filePattern: /\.sql$|\.cjs$/i,
        reason: `${tableName} table already exists - see registry (${tableInfo.purpose})`
      });

      // File-name pattern
      const tableKeyword = tableName.toLowerCase().replace(/_/g, '');
      existingPatterns[tableKeyword] = {
        existing: `${tableName} table`,
        what: tableInfo.purpose
      };
    }

    // Generate patterns for components
    const componentDirs = registry.components || {};
    for (const [category, info] of Object.entries(componentDirs)) {
      const existing = info.existing || info.common_patterns || [];
      existing.forEach(compName => {
        const keyword = compName.toLowerCase();
        existingPatterns[keyword] = {
          existing: `src/components/${category}/${compName}`,
          what: `${compName} component`
        };
      });
    }

    // Generate patterns for API routes
    const routes = registry.routes?.api || {};
    for (const [file, description] of Object.entries(routes)) {
      const routeName = path.basename(file, '.js');
      existingPatterns[routeName] = { existing: file, what: description };
    }

    // Add always-critical high-risk patterns
    highRiskPatterns.push(
      { pattern: /CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i, reason: 'Use CREATE TABLE IF NOT EXISTS to prevent duplicate tables' },
      { pattern: /CREATE\s+DATABASE/i, reason: 'Creating new database - check if database already exists' }
    );

    return { contentPatterns, existingPatterns, highRiskPatterns };
  } catch (e) {
    // If registry loading fails, return empty patterns (fail open)
    return { contentPatterns: [], existingPatterns: {}, highRiskPatterns: [] };
  }
}

// Load patterns from registry at startup
const DYNAMIC_PATTERNS = loadDuplicationPatterns();
const CONTENT_DUPLICATION_PATTERNS = DYNAMIC_PATTERNS.contentPatterns;
const EXISTING_PATTERNS = DYNAMIC_PATTERNS.existingPatterns;
const HIGH_RISK_PATTERNS = DYNAMIC_PATTERNS.highRiskPatterns;
```

---

## How to Apply Changes

### Option A: Manual Edit
1. Open `.claude/hooks/pre-tool-use-constraint.cjs` in your editor
2. Find lines 99-181 (search for `const HIGH_RISK_PATTERNS`)
3. Delete the entire block through `const EXISTING_PATTERNS = {`
4. Paste the new code from above
5. Save the file

### Option B: New Claude Session with Temporary Hook Disable
1. Rename hook: `mv .claude/hooks/pre-tool-use-constraint.cjs .claude/hooks/pre-tool-use-constraint.cjs.disabled`
2. Start new Claude session
3. Provide this context bundle
4. Claude applies the changes
5. Rename hook back: `mv .claude/hooks/pre-tool-use-constraint.cjs.disabled .claude/hooks/pre-tool-use-constraint.cjs`

---

## Verification Steps

After applying changes, verify the system works:

### Test 1: Block Duplicate Utility (Edit Tool)
```
Task: "Add validateEmail function to src/lib/utils.ts"
Expected: 🚫 BLOCKED - "validateEmail function already exists in src/utils/errorHandling.ts"
```

### Test 2: Block Duplicate Table (Write Tool)
```
Task: "Create migrations/create-users-table.cjs"
Expected: 🚫 BLOCKED - "APP_USERS table already exists"
```

### Test 3: Block Duplicate Component (Write Tool)
```
Task: "Create src/components/ui/new-button.tsx"
Expected: ⚠️ WARNING - "Button component already exists in src/components/ui/button.tsx"
```

### Test 4: Allow New Functionality
```
Task: "Create src/utils/pdf-generator.ts with generatePDF function"
Expected: ✅ ALLOWED - new functionality, not in registry
```

### Test 5: Verify Registry Documentation
```
Task: "What email utilities exist?"
AI should: Read .claude/duplication-registry.json and report validateEmail, formatError, handleApiError
```

---

## Success Criteria

- [ ] Hook file modified successfully
- [ ] No syntax errors when running: `node .claude/hooks/pre-tool-use-constraint.cjs`
- [ ] Test 1 (duplicate utility) blocked ✅
- [ ] Test 2 (duplicate table) blocked ✅
- [ ] Test 3 (duplicate component) warned ✅
- [ ] Test 4 (new functionality) allowed ✅
- [ ] Test 5 (registry as docs) works ✅

---

## Additional Context

### Why This Approach?

**Before (Hard-coded):**
- Add new utility → Must update hook code
- Add new table → Must update hook code
- Add new component → Must update hook code
- Hook code becomes bloated with every addition

**After (Dynamic):**
- Add new utility → Update registry JSON only
- Add new table → Update registry JSON only
- Add new component → Update registry JSON only
- Hook code stays clean and generic

### Side Benefits
1. **Registry = Documentation**: `.claude/duplication-registry.json` serves as living documentation
2. **Scalable**: Handles hundreds of utilities without code changes
3. **Human-Readable**: JSON format, easy to review and update
4. **AI-Readable**: Powers automatic protection

---

## Future Enhancements (Optional)

### Transparency Layer
Add mechanism to show warnings to user even when operation is allowed:

```javascript
// In hook, when allowing with warnings:
const response = {
  decision: 'allow',
  warnings: allWarnings  // Show to user
};
console.log(JSON.stringify(response));
process.exit(0);
```

Requires investigation: Does Claude Code support warning passthrough in hooks?

### Auto-Registry Updates
Script to scan codebase and auto-update registry:
```javascript
// scripts/update-duplication-registry.js
// Uses AST parsing to discover exports
// Updates .claude/duplication-registry.json
```

### Hook Approval Mechanism
Add temporary approval file:
```json
// .claude/approved-operations.json
{
  "approvals": [
    { "file": ".claude/hooks/pre-tool-use-constraint.cjs", "expires": "2025-12-03T12:00:00Z" }
  ]
}
```

---

## Files Involved

- `.claude/hooks/pre-tool-use-constraint.cjs` - Main hook (MODIFY THIS)
- `.claude/duplication-registry.json` - Central registry (READ ONLY for this change)
- `scripts/validation/rules/exceptions.cjs` - Locked files list (NO CHANGES)

---

## Rollback Plan

If issues arise, rollback by restoring hard-coded patterns from git:
```bash
git checkout .claude/hooks/pre-tool-use-constraint.cjs
```

Or restore from this backup (lines 99-181 before changes) - see "Find this code block" section above.

---

## Session Handoff Notes

**Current session state:**
- Tested duplication prevention with 3 tasks (button, email validation, users table)
- Found 3 failure modes: manual check worked, hook warned but I ignored, Edit tool bypassed
- Implemented rulebook lock successfully
- Blocked on applying hook changes due to lock (chicken-egg problem)

**Next session should:**
1. Apply the code change from this bundle
2. Run verification tests
3. Update todos to mark dynamic patterns as complete
4. Consider transparency layer enhancement

---

**End of Context Bundle**
