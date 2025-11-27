#!/usr/bin/env node

/**
 * Post-Tool-Use Hook: Real-time Structure Validation
 *
 * Runs validation after Claude writes/edits files to provide immediate feedback
 * on structure violations (file placement, naming, spec requirements).
 *
 * Receives event data via stdin as JSON:
 * {
 *   "tool_name": "Write" | "Edit" | "NotebookEdit",
 *   "tool_input": { "file_path": "...", ... },
 *   "tool_output": "..."
 * }
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read event data from stdin
let eventData = '';
process.stdin.on('data', chunk => {
  eventData += chunk;
});

process.stdin.on('end', () => {
  try {
    const event = JSON.parse(eventData);
    handleToolUse(event);
  } catch (error) {
    // Silently fail - don't block Claude's operation
    console.error('Hook error:', error.message);
    process.exit(0);
  }
});

function handleToolUse(event) {
  const { tool_name, tool_input } = event;

  // Only validate file write/edit operations
  const fileTools = ['Write', 'Edit', 'NotebookEdit'];
  if (!fileTools.includes(tool_name)) {
    return;
  }

  const filePath = tool_input?.file_path;
  if (!filePath) {
    return;
  }

  // Only validate project files (not system files or hook files)
  const projectRoot = process.cwd();
  const relativePath = path.relative(projectRoot, filePath);

  // Skip validation for:
  // - Hook files themselves
  // - Files outside project
  // - Hidden files/directories
  if (relativePath.startsWith('.claude/hooks') ||
      relativePath.startsWith('..') ||
      relativePath.startsWith('.git/')) {
    return;
  }

  // Run structure validation
  console.log(`\n[Hook] Validating structure after ${tool_name} on: ${relativePath}`);

  try {
    const validationScript = path.join(projectRoot, 'scripts/validation/validate-structure.cjs');

    if (!fs.existsSync(validationScript)) {
      console.log('[Hook] Validation script not found, skipping');
      return;
    }

    // Run validation with specific file check
    const result = execSync(`node "${validationScript}"`, {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Parse output for errors related to this file
    const lines = result.split('\n');
    const fileErrors = lines.filter(line =>
      line.includes(relativePath) &&
      (line.includes('ERROR') || line.includes('FORBIDDEN') || line.includes('VIOLATION'))
    );

    if (fileErrors.length > 0) {
      console.log('[Hook] ⚠️  Structure violations detected:');
      fileErrors.forEach(error => console.log('  ' + error));
      console.log('\n💡 Run: node scripts/validation/validate-structure.cjs for full report\n');
    } else {
      console.log('[Hook] ✅ No structure violations detected\n');
    }

  } catch (error) {
    // Validation found errors (non-zero exit code)
    if (error.status === 1 && error.stdout) {
      const lines = error.stdout.toString().split('\n');
      const fileErrors = lines.filter(line =>
        line.includes(relativePath) &&
        (line.includes('ERROR') || line.includes('FORBIDDEN') || line.includes('VIOLATION'))
      );

      if (fileErrors.length > 0) {
        console.log('[Hook] ⚠️  Structure violations detected:');
        fileErrors.forEach(err => console.log('  ' + err));
        console.log('\n💡 Fix these issues or run: node scripts/validation/validate-structure.cjs\n');
      }
    }
    // Don't block on validation errors - just inform
  }
}
