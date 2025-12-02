/**
 * PRE-TOOL-USE CONSTRAINT HOOK
 * Runs BEFORE file edits/writes to block modifications to locked files
 * 
 * This hook receives tool_input via stdin from Claude Code and can:
 * - Allow the operation (exit 0, no output)
 * - Block the operation (exit 2, with "decision": "block" in JSON output)
 * 
 * Reference: https://docs.anthropic.com/en/docs/claude-code/hooks
 */

const fs = require('fs');
const path = require('path');

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
    // Block the operation
    const response = {
      decision: 'block',
      reason: `🔒 BLOCKED: ${lockReason}\n\nThis file is protected and requires explicit human approval to modify.\nTo proceed, the user must acknowledge this change.`,
    };
    console.log(JSON.stringify(response));
    process.exit(2);
  }
  
  // Allow the operation
  process.exit(0);
}

main().catch(err => {
  // On error, allow operation (fail open for safety)
  console.error('Hook error:', err.message);
  process.exit(0);
});
