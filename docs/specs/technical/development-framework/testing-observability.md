---
version: 2.1
status: implemented
last_updated: 2025-12-02
applies_to: framework
description: Continuous observability layer for validating agent behavior against framework rules
---

# Observability Layer: Continuous Validation

**STATUS: ✅ IMPLEMENTED**

---

## Core Insight

> "If an action isn't measured, it cannot be improved." - IndyDevDan

This is NOT a phase to complete—it's an **always-on validation layer** that runs parallel to all framework development. Every time we improve the framework, we test it with real tasks and review the transcript.

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONTINUOUS VALIDATION LOOP                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────┐                                          │
│   │ Framework Change │ (add rule, update skill, modify hook)    │
│   └────────┬─────────┘                                          │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐                                          │
│   │ Run Test Task    │ (real bug fix or feature in Claude Code) │
│   └────────┬─────────┘                                          │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐                                          │
│   │ Review Transcript│ (what did Claude actually do?)           │
│   └────────┬─────────┘                                          │
│            │                                                    │
│            ▼                                                    │
│   ┌──────────────────┐                                          │
│   │ Compare vs Plan  │ (did it follow the framework rules?)     │
│   └────────┬─────────┘                                          │
│            │                                                    │
│       ┌────┴────┐                                               │
│       ▼         ▼                                               │
│    [PASS]    [FAIL] ──► Adjust framework/docs ──► Loop back     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Claude Code Already Provides

Claude Code hooks give us everything we need:

| Hook Event | What We Get | Use For |
|------------|-------------|---------|
| **`transcript_path`** | Full conversation JSONL file | Complete session replay |
| **`PostToolUse`** | Every tool call + input + output | Real-time action logging |
| **`Stop`** | Fires when Claude finishes | Session summary generation |
| **`SubagentStop`** | Sub-agent completion | Tracking parallel work |
| **`PreToolUse`** | Before tool executes | Blocking violations |

### The Transcript File

Every hook receives `transcript_path` pointing to a JSONL file with the **full conversation history**:
- Every user prompt
- Every Claude response
- Every tool call (name, input, output)
- Timestamps

**This is the observability gold mine.** We don't need to build elaborate logging—we just need to analyze the transcript.

---

## Implementation: Session Analyzer

### 1. Stop Hook - Trigger Analysis

**File**: `.claude/hooks/stop-session-analyzer.cjs`

```javascript
#!/usr/bin/env node
/**
 * Stop Hook: Analyze session transcript when Claude finishes
 * 
 * Input (via stdin):
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "~/.claude/projects/.../session.jsonl",
 *   "stop_hook_active": false
 * }
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function main() {
  const input = JSON.parse(await readStdin());
  
  // Don't re-analyze if we're continuing from a stop hook
  if (input.stop_hook_active) {
    process.exit(0);
  }
  
  const transcriptPath = input.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }
  
  const analysis = await analyzeTranscript(transcriptPath);
  
  // Write analysis to session log
  const logDir = path.join(process.env.CLAUDE_PROJECT_DIR || '.', '.claude', 'session-logs');
  fs.mkdirSync(logDir, { recursive: true });
  
  const logFile = path.join(logDir, `${input.session_id}.json`);
  fs.writeFileSync(logFile, JSON.stringify(analysis, null, 2));
  
  // Print summary to user (shown in verbose mode)
  console.log(`\n📊 Session Analysis: ${logFile}`);
  console.log(`   Files read: ${analysis.files_read.length}`);
  console.log(`   Files modified: ${analysis.files_modified.length}`);
  console.log(`   Commands run: ${analysis.commands_run.length}`);
  
  if (analysis.framework_violations.length > 0) {
    console.log(`   ⚠️  Framework violations: ${analysis.framework_violations.length}`);
  }
}

async function analyzeTranscript(transcriptPath) {
  const analysis = {
    session_id: path.basename(transcriptPath, '.jsonl'),
    timestamp: new Date().toISOString(),
    files_read: [],
    files_modified: [],
    commands_run: [],
    tool_calls: [],
    framework_violations: []
  };
  
  // Parse JSONL transcript
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      processEntry(entry, analysis);
    } catch (e) {
      // Skip malformed lines
    }
  }
  
  // Check for framework violations
  checkFrameworkCompliance(analysis);
  
  return analysis;
}

function processEntry(entry, analysis) {
  // Extract tool uses from transcript
  if (entry.type === 'tool_use' || entry.tool_name) {
    const toolCall = {
      tool: entry.tool_name || entry.name,
      input: entry.tool_input || entry.input,
      timestamp: entry.timestamp
    };
    analysis.tool_calls.push(toolCall);
    
    // Categorize by type
    if (['Read', 'Glob', 'Grep'].includes(toolCall.tool)) {
      analysis.files_read.push(toolCall.input?.file_path || toolCall.input?.pattern);
    }
    if (['Write', 'Edit'].includes(toolCall.tool)) {
      analysis.files_modified.push(toolCall.input?.file_path);
    }
    if (toolCall.tool === 'Bash') {
      analysis.commands_run.push(toolCall.input?.command);
    }
  }
}

function checkFrameworkCompliance(analysis) {
  // Check: Did Claude scout before editing? (for multi-file tasks)
  if (analysis.files_modified.length >= 3) {
    const firstModifyIndex = analysis.tool_calls.findIndex(t => 
      ['Write', 'Edit'].includes(t.tool)
    );
    const readCountBeforeEdit = analysis.tool_calls
      .slice(0, firstModifyIndex)
      .filter(t => ['Read', 'Glob', 'Grep'].includes(t.tool))
      .length;
    
    if (readCountBeforeEdit < 2) {
      analysis.framework_violations.push({
        rule: 'scout-before-edit',
        message: 'Edited 3+ files without adequate scouting first',
        severity: 'warning'
      });
    }
  }
  
  // Check: LOCKED files modified
  const LOCKED_FILES = ['server.js', 'config/database.js'];
  for (const file of analysis.files_modified) {
    if (LOCKED_FILES.some(locked => file?.includes(locked))) {
      analysis.framework_violations.push({
        rule: 'locked-file',
        message: `Modified LOCKED file: ${file}`,
        severity: 'error'
      });
    }
  }
  
  // Check: Did Claude create duplicate files?
  // (This would require checking existing structure)
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch(console.error);
```

### 2. Update settings.json

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-tool-use-constraint.cjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|NotebookEdit",
        "hooks": [
          {
            "type": "command", 
            "command": "node .claude/hooks/post-tool-use-validation.cjs"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/stop-session-analyzer.cjs"
          }
        ]
      }
    ]
  }
}
```

---

## Test Protocol

### Running a Test Task

1. **Pick a real task** (bug fix, feature, refactor)
2. **Run it in Claude Code** with framework rules active
3. **When Claude stops**, the Stop hook generates session analysis
4. **Review the session log** in `.claude/session-logs/`

### What to Look For

| Question | Where to Find Answer |
|----------|---------------------|
| Did Claude scout before editing? | `files_read` before first `files_modified` |
| Did Claude create duplicate files? | Check `files_modified` against existing structure |
| Did Claude modify LOCKED files? | `framework_violations` array |
| Did Claude follow the plan? | Compare planned files vs. actual `files_modified` |
| How many tool calls? | `tool_calls.length` |

### Example Session Analysis

```json
{
  "session_id": "abc123",
  "timestamp": "2025-12-02T10:30:00Z",
  "files_read": [
    "src/components/auth/LoginForm.tsx",
    "src/services/authService.ts",
    "src/hooks/useAuth.ts"
  ],
  "files_modified": [
    "src/components/auth/LoginForm.tsx"
  ],
  "commands_run": [
    "npm run lint src/components/auth/LoginForm.tsx"
  ],
  "tool_calls": [
    { "tool": "Read", "input": { "file_path": "src/components/auth/LoginForm.tsx" } },
    { "tool": "Grep", "input": { "pattern": "validation" } },
    { "tool": "Edit", "input": { "file_path": "src/components/auth/LoginForm.tsx" } },
    { "tool": "Bash", "input": { "command": "npm run lint..." } }
  ],
  "framework_violations": []
}
```

**Verdict**: ✅ Good session—scouted before editing, single file modified, ran lint.

---

## Test Scenarios for Framework Validation

| Scenario | Task | Expected Behavior | Validates |
|----------|------|-------------------|-----------|
| **Scout First** | "Fix login validation bug" | Reads 2+ files before editing | Scout phase works |
| **LOCKED File** | "Update database config" | Stops, asks permission | Constraint enforcement |
| **Multi-File** | "Add new API endpoint" | Creates files in correct locations | File placement rules |
| **Duplicate Check** | "Create email utility" | Finds existing utils, reuses | Duplication prevention |
| **10+ Files** | "Implement notifications" | Uses sub-agents | Orchestration pattern |

---

## Directory Structure

```
.claude/
├── hooks/
│   ├── pre-tool-use-constraint.cjs   # Blocks locked file edits
│   ├── post-tool-use-validation.cjs  # Structure validation on file changes
│   └── stop-session-analyzer.cjs     # Session analysis on stop
├── session-logs/                      # Session analysis JSON files
│   ├── README.md                      # Documentation
│   └── 2025-12-02T10-30-00_abc123.json
├── session-viewer.html                # Visual dashboard (open in browser)
└── settings.json                      # Hook configuration
```

---

## Using the Visual Dashboard

The `session-viewer.html` provides an interactive way to analyze sessions:

1. **Open**: `.claude/session-viewer.html` in any browser
2. **Load sessions**: Click "Load Session Folder" → select `.claude/session-logs/`
3. **Or drag & drop**: Drag JSON files directly onto the page
4. **Browse**: Click sessions in the sidebar to view details

**Dashboard Features**:
- 📊 Stats overview (files read/modified/created, commands, tools)
- ⚠️ Framework violations highlighted
- 🔧 Tool usage chart
- 📁 File lists with color coding (created/modified/read)
- 💻 Command history
- 📄 Raw JSON view with copy button

---

## CLI Commands for Review

```powershell
# View latest session analysis
Get-Content (Get-ChildItem .claude/session-logs/*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1)

# Find sessions with violations
Get-ChildItem .claude/session-logs/*.json | ForEach-Object { 
  $json = Get-Content $_ | ConvertFrom-Json
  if ($json.framework_violations.Count -gt 0) { $_.Name }
}

# Count tool calls across sessions
Get-ChildItem .claude/session-logs/*.json | ForEach-Object {
  $json = Get-Content $_ | ConvertFrom-Json
  [PSCustomObject]@{
    Session = $_.BaseName
    ToolCalls = $json.tool_calls.Count
    FilesModified = $json.files_modified.Count
  }
}

# Clean up old logs (30+ days)
Get-ChildItem .claude/session-logs/*.json | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

---

## Iteration Process

After each framework change:

1. **Make the change** (update skill, add validation rule, etc.)
2. **Run a test task** that should trigger the new rule
3. **Check session log** - did Claude behave as expected?
4. **If NO** → Adjust the framework
5. **If YES** → Document and move to next improvement

This is **not a checklist to complete**—it's how we work.

---

## Integration with Roadmap

The roadmap phases should be tested iteratively:

| When | Test With |
|------|-----------|
| After adding LOCKED files to exceptions.cjs | Task that touches server.js |
| After creating PreToolUse hook | Task that should be blocked |
| After adding scout-agent | Multi-file feature task |
| After updating coding-standards skill | Code quality task |

**Every framework improvement gets validated before moving to the next.**
