#!/usr/bin/env node

/**
 * Port Checker - Detects processes using development ports
 * Helps identify port conflicts before starting dev server
 */

import { execSync } from 'child_process';

const PORTS_TO_CHECK = [
  { port: 3001, name: 'Backend API' },
  { port: 5173, name: 'Vite Dev Server' },
  { port: 6379, name: 'Redis' }
];

console.log('🔍 Checking development ports...\n');

let hasConflicts = false;

PORTS_TO_CHECK.forEach(({ port, name }) => {
  try {
    // Windows: netstat to find processes using the port
    const output = execSync(`netstat -ano | findstr :${port}`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (output.trim()) {
      console.log(`⚠️  Port ${port} (${name}) is in use:`);
      
      // Extract PIDs from netstat output
      const lines = output.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });
      
      // Get process details for each PID
      pids.forEach(pid => {
        try {
          const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
            encoding: 'utf-8'
          }).trim();
          
          if (processInfo) {
            const [name] = processInfo.replace(/"/g, '').split(',');
            console.log(`   └─ PID ${pid}: ${name}`);
          }
        } catch (err) {
          // Process might have ended
        }
      });
      
      console.log('');
      hasConflicts = true;
    } else {
      console.log(`✅ Port ${port} (${name}) is available`);
    }
  } catch (err) {
    // No output means port is free
    console.log(`✅ Port ${port} (${name}) is available`);
  }
});

console.log('');

if (hasConflicts) {
  console.log('⚠️  Port conflicts detected!');
  console.log('Run "npm run dev:clean" to kill existing processes');
  process.exit(1);
} else {
  console.log('✅ All ports are available!');
  process.exit(0);
}
