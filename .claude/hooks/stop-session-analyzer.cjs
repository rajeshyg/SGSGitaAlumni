#!/usr/bin/env node

/**
 * Stop Hook: Session Transcript Analyzer
 * 
 * Analyzes the full session transcript when Claude finishes to provide
 * observability into agent behavior and framework compliance.
 * 
 * Receives via stdin:
 * {
 *   "session_id": "abc123",
 *   "transcript_path": "~/.claude/projects/.../session.jsonl",
 *   "stop_hook_active": boolean,
 *   "hook_event_name": "Stop"
 * }
 * 
 * Outputs: Session analysis JSON to .claude/session-logs/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
  // Files that should never be modified without explicit permission
  LOCKED_FILES: [
    'server.js',
    'config/database.js',
    'config/constants.js',
    '.env',
    '.env.local',
    '.env.production'
  ],
  // Minimum reads before editing multiple files (scout-before-edit rule)
  MIN_SCOUT_READS: 2,
  // Threshold for "multi-file task"
  MULTI_FILE_THRESHOLD: 3,
  // Blocked operations log file
  BLOCKED_OPS_LOG: '.claude/blocked-operations.jsonl'
};

async function main() {
  try {
    const input = JSON.parse(await readStdin());
    
    // Don't re-analyze if we're continuing from a stop hook
    if (input.stop_hook_active) {
      process.exit(0);
    }
    
    const transcriptPath = expandPath(input.transcript_path);
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      console.log('[Session Analyzer] No transcript found, skipping analysis');
      process.exit(0);
    }
    
    const analysis = await analyzeTranscript(transcriptPath, input.session_id);
    
    // Determine project directory
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const logDir = path.join(projectDir, '.claude', 'session-logs');
    
    // Ensure directory exists
    fs.mkdirSync(logDir, { recursive: true });
    
    // Write analysis with timestamp-based filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${timestamp}_${input.session_id || 'session'}.json`);
    fs.writeFileSync(logFile, JSON.stringify(analysis, null, 2));
    
    // Print summary to console (shown to user)
    printSummary(analysis, logFile);
    
  } catch (error) {
    console.error('[Session Analyzer] Error:', error.message);
    process.exit(0); // Don't block Claude on errors
  }
}

/**
 * Expand ~ to home directory (cross-platform)
 */
function expandPath(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Analyze the session transcript JSONL file
 */
async function analyzeTranscript(transcriptPath, sessionId) {
  const analysis = {
    session_id: sessionId || path.basename(transcriptPath, '.jsonl'),
    timestamp: new Date().toISOString(),
    transcript_path: transcriptPath,
    
    // Core metrics
    files_read: [],
    files_modified: [],
    files_created: [],
    commands_run: [],
    searches_performed: [],
    
    // NEW: Blocked operations tracking
    blocked_operations: [],
    
    // NEW: Duplication warnings (not blocked, but flagged)
    duplication_warnings: [],
    
    // Detailed tool tracking
    tool_calls: [],
    tool_summary: {},
    
    // Framework compliance
    framework_violations: [],
    framework_checks: {
      scout_before_edit: { passed: true, details: null },
      locked_files: { passed: true, details: null },
      duplicate_prevention: { passed: true, details: null }
    },
    
    // Session stats
    stats: {
      total_tool_calls: 0,
      blocked_count: 0,
      duplication_warning_count: 0,
      duration_estimate: null,
      first_tool_timestamp: null,
      last_tool_timestamp: null
    }
  };
  
  // Parse JSONL transcript
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n').filter(Boolean);
  
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      processTranscriptEntry(entry, analysis);
    } catch (e) {
      // Skip malformed lines
    }
  }
  
  // Load blocked operations from PreToolUse hook log
  loadBlockedOperations(analysis, sessionId);
  
  // Post-processing: compute stats and check violations
  computeStats(analysis);
  checkFrameworkCompliance(analysis);
  
  return analysis;
}

/**
 * Load blocked operations from the PreToolUse hook log
 */
function loadBlockedOperations(analysis, sessionId) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const blockedLogPath = path.join(projectDir, CONFIG.BLOCKED_OPS_LOG);
  
  if (!fs.existsSync(blockedLogPath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(blockedLogPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Only include blocked ops from this session (if session_id matches or is recent)
        if (entry.session_id === sessionId || entry.session_id === 'unknown') {
          analysis.blocked_operations.push(entry);
          analysis.stats.blocked_count++;
          
          // Remove blocked files from files_modified (they weren't actually modified)
          const blockedPath = entry.file_path;
          analysis.files_modified = analysis.files_modified.filter(f => 
            !f.includes(blockedPath) && !blockedPath.includes(path.basename(f))
          );
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    
    // Clean up old blocked operations log after reading
    // Keep only entries from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEntries = lines.filter(line => {
      try {
        const entry = JSON.parse(line);
        return new Date(entry.timestamp) > oneHourAgo;
      } catch (e) {
        return false;
      }
    });
    fs.writeFileSync(blockedLogPath, recentEntries.join('\n') + (recentEntries.length ? '\n' : ''));
    
  } catch (e) {
    // Ignore errors reading blocked log
  }
  
  // Also load duplication warnings
  loadDuplicationWarnings(analysis, sessionId);
}

/**
 * Load duplication warnings from the PreToolUse hook log
 */
function loadDuplicationWarnings(analysis, sessionId) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const warningsLogPath = path.join(projectDir, '.claude', 'duplication-warnings.jsonl');
  
  if (!fs.existsSync(warningsLogPath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(warningsLogPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.session_id === sessionId || entry.session_id === 'unknown') {
          analysis.duplication_warnings.push(entry);
          analysis.stats.duplication_warning_count++;
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    
    // Clean up old warnings (keep last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEntries = lines.filter(line => {
      try {
        const entry = JSON.parse(line);
        return new Date(entry.timestamp) > oneHourAgo;
      } catch (e) {
        return false;
      }
    });
    fs.writeFileSync(warningsLogPath, recentEntries.join('\n') + (recentEntries.length ? '\n' : ''));
    
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Process a single transcript entry
 */
function processTranscriptEntry(entry, analysis) {
  // Handle different transcript entry formats
  // Claude Code transcript format varies; we look for tool use patterns
  
  if (entry.type === 'tool_use' || entry.tool_name || entry.name) {
    const toolName = entry.tool_name || entry.name || entry.type;
    const toolInput = entry.tool_input || entry.input || {};
    const toolOutput = entry.tool_output || entry.output || entry.result;
    const timestamp = entry.timestamp || entry.created_at;
    
    const toolCall = {
      tool: toolName,
      input: toolInput,
      output: toolOutput ? summarizeOutput(toolOutput) : null,
      timestamp: timestamp
    };
    
    analysis.tool_calls.push(toolCall);
    analysis.stats.total_tool_calls++;
    
    // Track timestamps
    if (timestamp) {
      if (!analysis.stats.first_tool_timestamp) {
        analysis.stats.first_tool_timestamp = timestamp;
      }
      analysis.stats.last_tool_timestamp = timestamp;
    }
    
    // Categorize by tool type
    categorizeToolCall(toolCall, analysis);
  }
  
  // Also check for assistant messages that contain tool uses (nested format)
  // Claude Code transcript format: { type: "assistant", message: { role: "assistant", content: [...] } }
  if (entry.message?.role === 'assistant' && entry.message?.content) {
    const content = Array.isArray(entry.message.content) ? entry.message.content : [entry.message.content];
    for (const block of content) {
      if (block.type === 'tool_use') {
        processTranscriptEntry(block, analysis);
      }
    }
  }

  // Legacy format support: direct role/content at entry level
  if (entry.role === 'assistant' && entry.content) {
    const content = Array.isArray(entry.content) ? entry.content : [entry.content];
    for (const block of content) {
      if (block.type === 'tool_use') {
        processTranscriptEntry(block, analysis);
      }
    }
  }
}

/**
 * Categorize tool calls into meaningful buckets
 */
function categorizeToolCall(toolCall, analysis) {
  const tool = toolCall.tool;
  const input = toolCall.input || {};
  
  // Count by tool type
  analysis.tool_summary[tool] = (analysis.tool_summary[tool] || 0) + 1;
  
  // File operations
  if (['Read', 'read_file'].includes(tool)) {
    const filePath = input.file_path || input.path || input.filePath;
    if (filePath && !analysis.files_read.includes(filePath)) {
      analysis.files_read.push(filePath);
    }
  }
  
  if (['Write', 'create_file'].includes(tool)) {
    const filePath = input.file_path || input.path || input.filePath;
    if (filePath && !analysis.files_created.includes(filePath)) {
      analysis.files_created.push(filePath);
    }
  }
  
  if (['Edit', 'replace_string_in_file', 'multi_replace_string_in_file'].includes(tool)) {
    const filePath = input.file_path || input.path || input.filePath;
    if (filePath && !analysis.files_modified.includes(filePath)) {
      analysis.files_modified.push(filePath);
    }
    // Handle multi-replace
    if (input.replacements && Array.isArray(input.replacements)) {
      for (const r of input.replacements) {
        const rPath = r.file_path || r.filePath;
        if (rPath && !analysis.files_modified.includes(rPath)) {
          analysis.files_modified.push(rPath);
        }
      }
    }
  }
  
  // Command execution
  if (['Bash', 'run_in_terminal'].includes(tool)) {
    const command = input.command || input.cmd;
    if (command) {
      analysis.commands_run.push({
        command: command.substring(0, 200), // Truncate long commands
        background: input.isBackground || input.background || false
      });
    }
  }
  
  // Search operations
  if (['Glob', 'Grep', 'grep_search', 'file_search', 'semantic_search'].includes(tool)) {
    const query = input.query || input.pattern || input.search;
    if (query) {
      analysis.searches_performed.push({
        type: tool,
        query: query.substring(0, 100)
      });
    }
  }
}

/**
 * Summarize tool output (truncate if too long)
 */
function summarizeOutput(output) {
  if (typeof output === 'string') {
    return output.length > 500 ? output.substring(0, 500) + '...' : output;
  }
  if (typeof output === 'object') {
    const str = JSON.stringify(output);
    return str.length > 500 ? str.substring(0, 500) + '...' : output;
  }
  return output;
}

/**
 * Compute session statistics
 */
function computeStats(analysis) {
  // Estimate duration if we have timestamps
  if (analysis.stats.first_tool_timestamp && analysis.stats.last_tool_timestamp) {
    try {
      const start = new Date(analysis.stats.first_tool_timestamp);
      const end = new Date(analysis.stats.last_tool_timestamp);
      analysis.stats.duration_estimate = `${Math.round((end - start) / 1000)}s`;
    } catch (e) {
      // Ignore timestamp parsing errors
    }
  }
}

/**
 * Check for framework rule violations
 */
function checkFrameworkCompliance(analysis) {
  const allModified = [...analysis.files_modified, ...analysis.files_created];
  
  // Check 1: Scout before edit (for multi-file tasks)
  if (allModified.length >= CONFIG.MULTI_FILE_THRESHOLD) {
    const firstModifyIndex = analysis.tool_calls.findIndex(t =>
      ['Write', 'Edit', 'create_file', 'replace_string_in_file', 'multi_replace_string_in_file'].includes(t.tool)
    );
    
    const readCountBeforeEdit = analysis.tool_calls
      .slice(0, firstModifyIndex)
      .filter(t => ['Read', 'read_file', 'Glob', 'Grep', 'grep_search', 'file_search'].includes(t.tool))
      .length;
    
    if (readCountBeforeEdit < CONFIG.MIN_SCOUT_READS) {
      analysis.framework_checks.scout_before_edit = {
        passed: false,
        details: `Modified ${allModified.length} files with only ${readCountBeforeEdit} scout operations before first edit`
      };
      analysis.framework_violations.push({
        rule: 'scout-before-edit',
        severity: 'warning',
        message: `Edited ${allModified.length}+ files without adequate scouting first (${readCountBeforeEdit} reads before edit)`,
        recommendation: 'Use Scout phase to understand codebase before making changes'
      });
    }
  }
  
  // Check 2: LOCKED files - ONLY flag if actually modified (not blocked)
  // Skip this check if the operation was blocked (it's in blocked_operations)
  const blockedFiles = analysis.blocked_operations.map(b => b.file_path);
  
  for (const file of allModified) {
    // Skip if this file was blocked (means it wasn't actually modified)
    const wasBlocked = blockedFiles.some(blocked => 
      file.includes(blocked) || blocked.includes(path.basename(file))
    );
    if (wasBlocked) continue;
    
    const normalizedFile = file.replace(/\\/g, '/');
    for (const locked of CONFIG.LOCKED_FILES) {
      if (normalizedFile.includes(locked) || normalizedFile.endsWith(locked)) {
        analysis.framework_checks.locked_files = {
          passed: false,
          details: `Modified LOCKED file: ${file}`
        };
        analysis.framework_violations.push({
          rule: 'locked-file',
          severity: 'error',
          message: `Modified LOCKED file: ${file}`,
          recommendation: 'LOCKED files require explicit human approval before modification'
        });
        break;
      }
    }
  }
  
  // Check 2b: Add positive note if locked files were properly blocked
  if (analysis.blocked_operations.length > 0) {
    analysis.framework_checks.locked_files = {
      passed: true,
      details: `${analysis.blocked_operations.length} locked file edit(s) were properly blocked`
    };
  }
  
  // Check 3: Potential duplicate files created
  // (Basic check - looking for similar filenames in different locations)
  const createdBasenames = analysis.files_created.map(f => path.basename(f));
  const duplicateBases = createdBasenames.filter((name, idx) =>
    createdBasenames.indexOf(name) !== idx
  );
  
  if (duplicateBases.length > 0) {
    analysis.framework_checks.duplicate_prevention = {
      passed: false,
      details: `Possible duplicate files created: ${duplicateBases.join(', ')}`
    };
    analysis.framework_violations.push({
      rule: 'duplicate-prevention',
      severity: 'warning',
      message: `Possible duplicate files created with same name: ${duplicateBases.join(', ')}`,
      recommendation: 'Check if existing similar files should be reused instead'
    });
  }
  
  // Check 3b: Flag if duplication warnings were triggered (but not blocked)
  if (analysis.duplication_warnings && analysis.duplication_warnings.length > 0) {
    const warningCount = analysis.duplication_warnings.length;
    analysis.framework_checks.duplicate_prevention = {
      passed: false,
      details: `${warningCount} potential duplication warning(s) detected`
    };
    
    // Add each warning as a violation
    for (const warning of analysis.duplication_warnings) {
      analysis.framework_violations.push({
        rule: 'duplication-warning',
        severity: 'warning',
        message: `Potential duplicate: ${path.basename(warning.file_path)} - ${warning.warning}`,
        recommendation: 'Check .claude/duplication-registry.json for existing implementations'
      });
    }
  }
}

/**
 * Print analysis summary to console
 */
function printSummary(analysis, logFile) {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SESSION ANALYSIS');
  console.log('═'.repeat(60));
  
  console.log(`\n📁 Files Read:     ${analysis.files_read.length}`);
  console.log(`📝 Files Modified: ${analysis.files_modified.length}`);
  console.log(`✨ Files Created:  ${analysis.files_created.length}`);
  console.log(`💻 Commands Run:   ${analysis.commands_run.length}`);
  console.log(`🔍 Searches:       ${analysis.searches_performed.length}`);
  console.log(`🔧 Total Tools:    ${analysis.stats.total_tool_calls}`);
  
  // Show blocked operations (constraints working!)
  if (analysis.stats.blocked_count > 0) {
    console.log(`🛡️  Blocked Ops:    ${analysis.stats.blocked_count} (constraints enforced)`);
  }
  
  // Show duplication warnings
  if (analysis.stats.duplication_warning_count > 0) {
    console.log(`⚠️  Dup Warnings:   ${analysis.stats.duplication_warning_count}`);
  }
  
  if (analysis.stats.duration_estimate) {
    console.log(`⏱️  Duration:       ~${analysis.stats.duration_estimate}`);
  }
  
  // Show top tools
  const topTools = Object.entries(analysis.tool_summary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topTools.length > 0) {
    console.log('\n📈 Top Tools:');
    for (const [tool, count] of topTools) {
      console.log(`   ${tool}: ${count}`);
    }
  }
  
  // Show blocked operations details
  if (analysis.blocked_operations.length > 0) {
    console.log('\n🛡️  BLOCKED OPERATIONS (Constraints Enforced):');
    for (const blocked of analysis.blocked_operations) {
      console.log(`   ✓ ${blocked.tool} on ${path.basename(blocked.file_path)} - ${blocked.reason}`);
    }
  }
  
  // Show duplication warnings
  if (analysis.duplication_warnings && analysis.duplication_warnings.length > 0) {
    console.log('\n⚠️  DUPLICATION WARNINGS:');
    for (const warning of analysis.duplication_warnings) {
      console.log(`   ⚠️  ${path.basename(warning.file_path)}: ${warning.warning}`);
    }
    console.log('   → Check .claude/duplication-registry.json for existing implementations');
  }
  
  // Framework compliance
  if (analysis.framework_violations.length > 0) {
    console.log('\n⚠️  FRAMEWORK VIOLATIONS:');
    for (const v of analysis.framework_violations) {
      const icon = v.severity === 'error' ? '🔴' : '🟡';
      console.log(`   ${icon} [${v.rule}] ${v.message}`);
    }
  } else {
    console.log('\n✅ Framework Compliance: All checks passed');
  }
  
  console.log('\n📄 Full analysis: ' + path.relative(process.cwd(), logFile));
  console.log('═'.repeat(60) + '\n');
}

/**
 * Read all data from stdin
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    // Handle case where stdin is empty or closed
    setTimeout(() => {
      if (!data) resolve('{}');
    }, 100);
  });
}

// Run
main().catch(err => {
  console.error('[Session Analyzer] Fatal error:', err);
  process.exit(0);
});
