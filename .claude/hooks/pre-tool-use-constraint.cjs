/**
 * PRE-TOOL-USE CONSTRAINT HOOK
 * Runs BEFORE file edits/writes to:
 * 1. Block modifications to locked files
 * 2. Warn about potential duplication issues
 * 
 * This hook receives tool_input via stdin from Claude Code and can:
 * - Allow the operation (exit 0, no output)
 * - Block the operation (exit 2, with "decision": "block" in JSON output)
 * 
 * When blocking, logs to .claude/blocked-operations.jsonl so the session
 * analyzer can distinguish blocked vs successful operations.
 * 
 * Reference: https://docs.anthropic.com/en/docs/claude-code/hooks
 */

const fs = require('fs');
const path = require('path');

/**
 * Log blocked operation to file for session analyzer to read
 */
function logBlockedOperation(toolName, filePath, reason, sessionId) {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const logFile = path.join(projectDir, '.claude', 'blocked-operations.jsonl');
    
    const entry = {
      timestamp: new Date().toISOString(),
      session_id: sessionId || 'unknown',
      tool: toolName,
      file_path: filePath,
      reason: reason,
      blocked: true
    };
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    
    // Append to log
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Don't fail the hook on logging errors
  }
}

/**
 * Log duplication warning (not a block, just tracking)
 */
function logDuplicationWarning(toolName, filePath, warning, sessionId) {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const logFile = path.join(projectDir, '.claude', 'duplication-warnings.jsonl');
    
    const entry = {
      timestamp: new Date().toISOString(),
      session_id: sessionId || 'unknown',
      tool: toolName,
      file_path: filePath,
      warning: warning,
      blocked: false
    };
    
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Don't fail on logging errors
  }
}

// Import constraint checker
let constraintChecker;
try {
  constraintChecker = require(path.join(__dirname, '../../scripts/validation/validators/constraint-check.cjs'));
} catch (e) {
  // Fallback: define inline if module not found
  constraintChecker = null;
}

// Inline LOCKED_FILES as fallback
const LOCKED_FILES_FALLBACK = [
  'server.js',
  'docker-compose.yml',
  'Dockerfile',
  'nginx.conf',
  'config/database.js',
  'middleware/auth.js',
  'middleware/rateLimit.js',
  '.env',
  'vite.config.js',
  'tsconfig.json',
  'package.json',
];

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

/**
 * Check file path for potential duplication
 * Returns warning message or null
 */
function checkForDuplication(filePath, content) {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const fileName = path.basename(normalizedPath);
  const warnings = [];
  
  // Check if creating a new file (Write tool on non-existent file)
  // Only check for patterns in new files, not edits to existing
  
  // Check filename against known patterns
  for (const [keyword, info] of Object.entries(EXISTING_PATTERNS)) {
    if (fileName.includes(keyword) || normalizedPath.includes(keyword)) {
      warnings.push(`⚠️ "${keyword}" functionality may already exist in: ${info.existing} (${info.what})`);
    }
  }
  
  // Check content for high-risk patterns
  if (content) {
    for (const { pattern, filePattern, reason } of HIGH_RISK_PATTERNS) {
      if (filePattern && !filePattern.test(normalizedPath)) continue;
      if (pattern.test(content)) {
        warnings.push(`⚠️ ${reason}`);
      }
    }
  }
  
  return warnings.length > 0 ? warnings : null;
}

/**
 * Check if a file path matches locked patterns
 */
function isFileLocked(filePath) {
  if (constraintChecker) {
    const result = constraintChecker.checkLockedFile(filePath);
    return result.blocked ? result.reason : null;
  }
  
  // Fallback check
  const normalizedPath = filePath.replace(/\\/g, '/');
  for (const locked of LOCKED_FILES_FALLBACK) {
    if (normalizedPath.endsWith(locked) || normalizedPath.endsWith(`/${locked}`)) {
      return `File is locked: ${locked}`;
    }
  }
  return null;
}

/**
 * Extract file path from tool input based on tool type
 */
function extractFilePath(toolName, toolInput) {
  // Different tools use different property names
  const pathProps = ['file_path', 'filePath', 'path', 'target_file', 'targetFile'];
  
  for (const prop of pathProps) {
    if (toolInput[prop]) {
      return toolInput[prop];
    }
  }
  
  // For Write tool, check content for file indicators
  if (toolInput.content && typeof toolInput.content === 'string') {
    // Some tools embed path in content
    return null;
  }
  
  return null;
}

/**
 * Main hook handler
 */
async function main() {
  // Read hook input from stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  
  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch (e) {
    // Invalid JSON, allow operation
    process.exit(0);
  }
  
  const { tool_name, tool_input } = hookData;
  
  // Only check file modification tools
  const fileModTools = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'write_file', 'edit_file'];
  if (!fileModTools.some(t => tool_name?.includes(t))) {
    process.exit(0);
  }
  
  // Extract file path
  const filePath = extractFilePath(tool_name, tool_input || {});
  if (!filePath) {
    process.exit(0);
  }
  
  // Check if file is locked
  const lockReason = isFileLocked(filePath);
  if (lockReason) {
    // Log the blocked operation for session analyzer
    logBlockedOperation(tool_name, filePath, lockReason, hookData.session_id);
    
    // Block the operation
    const response = {
      decision: 'block',
      reason: `🔒 BLOCKED: ${lockReason}\n\nThis file is protected and requires explicit human approval to modify.\nTo proceed, the user must acknowledge this change.`,
    };
    console.log(JSON.stringify(response));
    process.exit(2);
  }
  
  // Check for potential duplication (only for Write = new files)
  if (tool_name === 'Write' || tool_name === 'write_file') {
    const content = tool_input?.content || '';
    const warnings = checkForDuplication(filePath, content);
    
    if (warnings && warnings.length > 0) {
      // Log the warning for tracking
      logDuplicationWarning(tool_name, filePath, warnings.join('; '), hookData.session_id);
      
      // Check if this is a high-risk duplication (database operations)
      const hasDbDuplication = warnings.some(w => 
        w.includes('CREATE TABLE') || 
        w.includes('CREATE DATABASE') ||
        w.includes('User tables already exist')
      );
      
      if (hasDbDuplication) {
        // Block database-related duplications - these are dangerous
        logBlockedOperation(tool_name, filePath, warnings.join('; '), hookData.session_id);
        
        const response = {
          decision: 'block',
          reason: `🚫 DUPLICATION RISK DETECTED:\n\n${warnings.join('\n')}\n\n` +
            `Before creating this file, please:\n` +
            `1. Check .claude/duplication-registry.json for existing tables\n` +
            `2. Search for existing similar functionality\n` +
            `3. Consider extending existing code instead of creating new\n\n` +
            `To proceed, confirm you've checked for duplicates.`,
        };
        console.log(JSON.stringify(response));
        process.exit(2);
      }
      
      // For non-database warnings, just log (don't block)
      // The warning is tracked and will show in session analysis
    }
  }
  
  // NEW: Check content for BOTH Write and Edit operations
  const content = tool_input?.content || tool_input?.new_string || tool_input?.newString || '';
  if (content && content.length > 0) {
    const contentWarnings = [];
    
    for (const check of CONTENT_DUPLICATION_PATTERNS) {
      if (check.pattern.test(content)) {
        const msg = `⚠️ DUPLICATE: "${check.what}" already exists in: ${check.existing}`;
        contentWarnings.push({ msg, block: check.block });
      }
    }
    
    if (contentWarnings.length > 0) {
      const allWarnings = contentWarnings.map(w => w.msg);
      logDuplicationWarning(tool_name, filePath, allWarnings.join('; '), hookData.session_id);
      
      // Check if any require blocking
      const shouldBlock = contentWarnings.some(w => w.block);
      
      if (shouldBlock) {
        logBlockedOperation(tool_name, filePath, allWarnings.join('; '), hookData.session_id);
        
        const response = {
          decision: 'block',
          reason: `🚫 DUPLICATE CODE DETECTED:\n\n${allWarnings.join('\n')}\n\n` +
            `This code already exists elsewhere in the codebase.\n` +
            `Please:\n` +
            `1. Import from the existing location instead of duplicating\n` +
            `2. Check .claude/duplication-registry.json for the canonical location\n` +
            `3. If you need different behavior, extend the existing function\n`,
        };
        console.log(JSON.stringify(response));
        process.exit(2);
      }
    }
  }
  
  // Allow the operation
  process.exit(0);
}

main().catch(err => {
  // On error, allow operation (fail open for safety)
  console.error('Hook error:', err.message);
  process.exit(0);
});
