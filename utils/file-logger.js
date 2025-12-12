import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory paths (ES modules compat)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../logs');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'errors.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
}

/**
 * Logs a prominent separator to indicate the start of a new logging session.
 */
export function logSessionStart() {
  const timestamp = new Date().toISOString();
  const separator = `\n${'='.repeat(80)}\nSTARTING NEW LOGGING SESSION: ${timestamp}\n${'='.repeat(80)}\n\n`;
  fs.appendFileSync(ERROR_LOG_FILE, separator); // Use sync for startup
}

/**
 * Appends a log entry to the error log file.
 * Thread-safeish (Node.js appendFile is atomic for small writes).
 * 
 * @param {string} level - 'ERROR', 'WARN', 'UNCAUGHT'
 * @param {string} source - 'SERVER' or 'CLIENT'
 * @param {string} message - The main error message
 * @param {string} [stack] - Optional stack trace
 */
export function logToFile(level, source, message, stack) {
  const timestamp = new Date().toISOString();
  
  let logEntry = `[${timestamp}] [${level}] [${source}] ${message}\n`;
  if (stack) {
    logEntry += `Stack: ${stack}\n`;
  }
  logEntry += '-'.repeat(80) + '\n'; // Separator

  fs.appendFile(ERROR_LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}
