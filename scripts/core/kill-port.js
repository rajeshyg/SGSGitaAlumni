#!/usr/bin/env node

/**
 * Kill Process on Port - Kills processes using specific ports
 * More surgical than killing all Node processes
 */

import { execSync } from 'child_process';

const ports = process.argv.slice(2);

if (ports.length === 0) {
  console.log('Usage: node kill-port.js <port1> [port2] [port3]...');
  console.log('Example: node kill-port.js 3001 5173');
  process.exit(1);
}

console.log('🔪 Killing processes on ports:', ports.join(', '));

ports.forEach(port => {
  try {
    // Windows: netstat to find processes using the port
    const output = execSync(`netstat -ano | findstr :${port}`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    if (output.trim()) {
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
      
      // Kill each process
      pids.forEach(pid => {
        try {
          const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
            encoding: 'utf-8'
          }).trim();
          
          if (processInfo) {
            const [name] = processInfo.replace(/"/g, '').split(',');
            console.log(`   Killing PID ${pid} (${name}) on port ${port}`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          }
        } catch (err) {
          // Process might have ended or couldn't be killed
        }
      });
      
      console.log(`✅ Port ${port} is now free`);
    } else {
      console.log(`✅ Port ${port} is already free`);
    }
  } catch (err) {
    // No output means port is free
    console.log(`✅ Port ${port} is already free`);
  }
});

console.log('\n✅ Done!');
