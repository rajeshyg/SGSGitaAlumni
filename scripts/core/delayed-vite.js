#!/usr/bin/env node

/**
 * Delayed Vite Start - Waits for backend to be ready before starting Vite
 * Prevents "WebSocket proxy error" on startup
 */

import { spawn } from 'child_process';

const DELAY_MS = 2000; // 2 seconds

console.log('⏳ Waiting 2 seconds for backend to start...');

setTimeout(() => {
  console.log('🚀 Starting Vite...\n');
  
  // Start Vite
  const vite = spawn('vite', [], {
    stdio: 'inherit',
    shell: true
  });
  
  vite.on('error', (err) => {
    console.error('Failed to start Vite:', err);
    process.exit(1);
  });
  
  vite.on('exit', (code) => {
    process.exit(code || 0);
  });
  
}, DELAY_MS);
