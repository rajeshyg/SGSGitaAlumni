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
  MULTI_FILE_THRESHOLD: 3
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
  
  // Post-processing: compute stats and check violations
  computeStats(analysis);
  checkFrameworkCompliance(analysis);
  
  return analysis;
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
  
  // Check 2: LOCKED files modified
  for (const file of allModified) {
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
