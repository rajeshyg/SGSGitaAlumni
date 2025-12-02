/**
 * CONSTRAINT CHECK VALIDATOR
 * Validates operations against Phase 0 constraints (LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS)
 * 
 * Usage:
 *   node scripts/validation/validators/constraint-check.cjs --file <path>
 *   node scripts/validation/validators/constraint-check.cjs --command "<command>"
 *   node scripts/validation/validators/constraint-check.cjs --port <number>
 */

const path = require('path');
const { minimatch } = require('minimatch');
const { LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS } = require('../rules/exceptions.cjs');

/**
 * Check if a file path matches any locked file pattern
 * @param {string} filePath - Path to check (relative or absolute)
 * @returns {{ blocked: boolean, reason?: string, pattern?: string }}
 */
function checkLockedFile(filePath) {
  // Normalize path to use forward slashes and make relative
  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = normalizedPath.replace(/^.*?\/SGSGitaAlumni\//, '');
  
  for (const pattern of LOCKED_FILES) {
    // Handle glob patterns
    if (pattern.includes('*')) {
      if (minimatch(relativePath, pattern, { dot: true })) {
        return {
          blocked: true,
          reason: `File matches locked pattern: ${pattern}`,
          pattern,
        };
      }
    } else {
      // Exact match or path ends with the locked file
      if (relativePath === pattern || relativePath.endsWith(`/${pattern}`) || relativePath.endsWith(pattern)) {
        return {
          blocked: true,
          reason: `File is locked: ${pattern}`,
          pattern,
        };
      }
    }
  }
  
  return { blocked: false };
}

/**
 * Check if a command contains any stop triggers
 * @param {string} command - Command string to check
 * @returns {{ blocked: boolean, reason?: string, pattern?: string }}
 */
function checkStopTrigger(command) {
  for (const trigger of STOP_TRIGGERS) {
    if (trigger.pattern.test(command)) {
      return {
        blocked: true,
        reason: trigger.reason,
        pattern: trigger.pattern.toString(),
      };
    }
  }
  
  return { blocked: false };
}

/**
 * Check if a port is allowed
 * @param {number} port - Port number to check
 * @returns {{ allowed: boolean, reason?: string, currentUser?: string }}
 */
function checkPortConstraint(port) {
  const portNum = parseInt(port, 10);
  
  // Check forbidden ports
  if (PORT_CONSTRAINTS.forbidden.includes(portNum)) {
    return {
      allowed: false,
      reason: `Port ${portNum} is forbidden (system port)`,
    };
  }
  
  // Check reserved ports
  if (PORT_CONSTRAINTS.reserved[portNum]) {
    return {
      allowed: true,
      reason: `Port ${portNum} is reserved for: ${PORT_CONSTRAINTS.reserved[portNum]}`,
      currentUser: PORT_CONSTRAINTS.reserved[portNum],
    };
  }
  
  // Check if in defined ranges
  for (const [rangeName, range] of Object.entries(PORT_CONSTRAINTS.ranges)) {
    if (portNum >= range.start && portNum <= range.end) {
      return {
        allowed: true,
        reason: `Port ${portNum} is in ${rangeName} range (${range.purpose})`,
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Validate all constraints for a given context
 * @param {{ file?: string, command?: string, port?: number }} context
 * @returns {{ valid: boolean, violations: Array<{ type: string, message: string }> }}
 */
function validateConstraints(context) {
  const violations = [];
  
  if (context.file) {
    const fileCheck = checkLockedFile(context.file);
    if (fileCheck.blocked) {
      violations.push({
        type: 'LOCKED_FILE',
        message: fileCheck.reason,
        pattern: fileCheck.pattern,
      });
    }
  }
  
  if (context.command) {
    const cmdCheck = checkStopTrigger(context.command);
    if (cmdCheck.blocked) {
      violations.push({
        type: 'STOP_TRIGGER',
        message: cmdCheck.reason,
        pattern: cmdCheck.pattern,
      });
    }
  }
  
  if (context.port !== undefined) {
    const portCheck = checkPortConstraint(context.port);
    if (!portCheck.allowed) {
      violations.push({
        type: 'PORT_FORBIDDEN',
        message: portCheck.reason,
      });
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const context = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    if (flag === '--file') context.file = value;
    if (flag === '--command') context.command = value;
    if (flag === '--port') context.port = parseInt(value, 10);
  }
  
  if (Object.keys(context).length === 0) {
    console.log('Usage:');
    console.log('  node constraint-check.cjs --file <path>');
    console.log('  node constraint-check.cjs --command "<command>"');
    console.log('  node constraint-check.cjs --port <number>');
    process.exit(0);
  }
  
  const result = validateConstraints(context);
  
  if (result.valid) {
    console.log('✅ No constraint violations');
    process.exit(0);
  } else {
    console.log('❌ Constraint violations found:');
    result.violations.forEach(v => {
      console.log(`  [${v.type}] ${v.message}`);
    });
    process.exit(1);
  }
}

module.exports = {
  checkLockedFile,
  checkStopTrigger,
  checkPortConstraint,
  validateConstraints,
  LOCKED_FILES,
  STOP_TRIGGERS,
  PORT_CONSTRAINTS,
};
