import express from 'express';
import { logToFile } from '../utils/file-logger.js';

const router = express.Router();

// ============================================================================
// DEV TOOLS: CLIENT LOGGING BRIDGE
// ============================================================================
// This endpoint receives console errors from the browser and prints them to the server terminal
// Usage: POST /api/dev/client-log { type: 'ERROR', message: '...', stack: '...' }

router.post('/client-log', (req, res) => {
  const { type, message, stack } = req.body;
  
  // Save to file system immediately
  logToFile(type || 'ERROR', 'CLIENT', message, stack);
  
  // ANSI colors for better visibility in terminal
  const RED = '\x1b[31m';  const YELLOW = '\x1b[33m';
  const CYAN = '\x1b[36m';
  const RESET = '\x1b[0m';
  
  const prefix = `${CYAN}[CLIENT]${RESET}`;
  const color = type === 'ERROR' || type === 'UNCAUGHT' ? RED : YELLOW;
  
  // Print the main message
  console.log(`${prefix} ${color}${type}: ${message}${RESET}`);
  
  // Print stack trace if available, indented
  if (stack) {
    console.log(`${stack.split('\n').map(line => `    ${line}`).join('\n')}`);
  }
  
  res.sendStatus(200);
});

export default router;
